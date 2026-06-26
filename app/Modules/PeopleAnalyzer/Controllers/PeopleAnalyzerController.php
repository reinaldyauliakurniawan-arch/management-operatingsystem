<?php

namespace App\Modules\PeopleAnalyzer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PeopleAnalyzer\Models\Evaluation;
use App\Modules\PeopleAnalyzer\Models\PeopleAnalyzerStandard;
use App\Models\User;
use App\Modules\VTO\Models\VTOPlan;
use App\Modules\AccountabilityChart\Models\Seat;
use App\Modules\Teams\Models\Team;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PeopleAnalyzerController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = TenantContext::teamId();
        $user   = Auth::user();
        $role   = $user->roleIn($teamId);
        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader.');
        }
    }

    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $userId   = Auth::id();
        $user     = Auth::user();
        $role     = $user->roleIn($teamId);
        $isLeader = $role === 'leader' || $user->isAdminOfActiveOrg();

        // ponytail: scope evaluasi ke seluruh organisasi (bukan cuma team aktif).
        // Sebelumnya leader hanya bisa lihat evaluasi di team aktif — HR mengeluh
        // "aku gak bisa lihat data member selain di timku". Sekarang leader lihat
        // semua evaluasi di org-nya. Member biasa tetap hanya lihat evaluasi diri sendiri.
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId       = $currentTeam->organization_id;
        $orgTeamIds  = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');

        $standard = PeopleAnalyzerStandard::whereIn('team_id', $orgTeamIds)->first();

        $evalsQuery = Evaluation::with('evaluator', 'evaluatee', 'seat', 'team')
            ->withoutGlobalScopes()
            ->whereIn('team_id', $orgTeamIds);

        if (!$isLeader) {
            $evalsQuery->where('evaluatee_id', $userId);
        }

        $evals = $evalsQuery->latest()->get()->map(function ($e) use ($standard) {
            $e->seat_fit_computed = $e->computeSeatFit($standard);
            $e->core_values_scores = $e->core_values_scores ?? [];
            $e->seat_title = $e->seat?->title ?? $e->manual_seat_title;
            $e->team_name  = $e->team?->name;
            $e->display_name = $e->is_candidate
                ? ($e->candidate_name ?? 'Kandidat')
                : ($e->evaluatee?->name ?? '—');
            return $e;
        });

        // ponytail: dropdown evaluatee juga org-wide — leader bisa evaluate siapapun di org.
        $users = $isLeader
            ? User::whereHas('teamMemberships', fn($q) => $q->whereIn('team_id', $orgTeamIds))
                ->orderBy('name')
                ->get(['id', 'name'])
            : collect();

        // Core values dari VTO organisasi
        $vto = $orgId
            ? VTOPlan::withoutGlobalScopes()->where('organization_id', $orgId)->first()
            : null;
        $coreValues = $vto?->core_values ?? [];

        // ponytail: seats dari SEMUA team di org (bukan cuma team aktif).
        // HR mengeluh "aku cuma bisa input kandidat yang untuk divisiku ajaaa"
        // padahal oprec sering cross-divisi. Sekarang dropdown "posisi yang dinilai"
        // menampilkan semua seat di org, beserta nama team pemiliknya.
        $seats = Seat::withoutGlobalScopes()
            ->with('team:id,name')
            ->whereIn('team_id', $orgTeamIds)
            ->orderBy('title')
            ->get(['id', 'title', 'team_id'])
            ->map(fn($s) => [
                'id'        => $s->id,
                'title'     => $s->title ?: '(tanpa judul)',
                'team_id'   => $s->team_id,
                'team_name' => $s->team?->name,
            ]);

        return Inertia::render('PeopleAnalyzer/Index', [
            'evaluations'     => $evals,
            'users'           => $users,
            'standard'        => $standard,
            'canManage'       => $isLeader,
            'vto_core_values' => $coreValues,
            'seats'           => $seats,
        ]);
    }

    public function store(Request $request)
    {
        $this->requireLeader();

        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId       = $currentTeam->organization_id;
        $orgTeamIds  = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');

        $standard = PeopleAnalyzerStandard::whereIn('team_id', $orgTeamIds)->first();

        $validated = $request->validate([
            'evaluatee_id'       => 'nullable|exists:users,id',
            'is_candidate'       => 'boolean',
            'candidate_name'     => 'nullable|string|max:255',
            // ponytail: seat_id divalidasi sebagai seat di org aktif (bukan cuma team aktif).
            'seat_id'            => ['nullable', Rule::exists('seats', 'id')->whereIn('team_id', $orgTeamIds)],
            'manual_seat_title'  => 'nullable|string|max:255',
            'gwc_get'            => 'required|boolean',
            'gwc_want'           => 'required|boolean',
            'gwc_capacity'       => 'required|boolean',
            'core_values_scores' => 'required|array',
            'core_values_scores.*.value'  => 'required|string',
            'core_values_scores.*.symbol' => 'required|in:+,+/-,-',
            'period'             => 'nullable|string|max:50',
            'notes'              => 'nullable|string',
        ]);

        $isCandidate = $request->boolean('is_candidate');
        if (!$isCandidate && empty($validated['evaluatee_id'])) {
            abort(422, 'Evaluatee wajib dipilih jika bukan kandidat eksternal.');
        }

        // ponytail: team_id evaluasi pakai team_id dari seat yang dipilih.
        // Kalau seat dari team lain di org, evaluasi tersimpan di team itu — bukan
        // team aktif. Ini fix bug "input kandidat cuma divisiku" — sekarang oprec
        // cross-divisi bisa, evaluasi tersimpan di team yang punya seat tersebut.
        $evalTeamId = $teamId;
        if (!empty($validated['seat_id'])) {
            $seat = Seat::withoutGlobalScopes()->find($validated['seat_id']);
            if ($seat && $orgTeamIds->contains($seat->team_id)) {
                $evalTeamId = $seat->team_id;
            }
        }

        $eval = Evaluation::create([
            ...$validated,
            'team_id'      => $evalTeamId,
            'evaluator_id' => Auth::id(),
            'created_by'   => Auth::id(),
        ]);

        $eval->update(['seat_fit' => $eval->computeSeatFit($standard)]);

        return back()->with('message', 'Evaluasi disimpan.');
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $this->requireLeader();

        $teamId      = TenantContext::teamId();
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId       = $currentTeam->organization_id;
        $orgTeamIds  = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');
        $standard    = PeopleAnalyzerStandard::whereIn('team_id', $orgTeamIds)->first();

        // ponytail: pastikan evaluation yang di-update milik org aktif.
        abort_unless(
            $orgTeamIds->contains($evaluation->team_id),
            403,
            'Evaluasi bukan milik organisasi aktif.',
        );

        $validated = $request->validate([
            'gwc_get'            => 'sometimes|boolean',
            'gwc_want'           => 'sometimes|boolean',
            'gwc_capacity'       => 'sometimes|boolean',
            'core_values_scores' => 'sometimes|array',
            'seat_id'            => ['nullable', Rule::exists('seats', 'id')->whereIn('team_id', $orgTeamIds)],
            'manual_seat_title'  => 'nullable|string|max:255',
            'period'             => 'nullable|string|max:50',
            'notes'              => 'nullable|string',
        ]);

        $evaluation->update([...$validated, 'updated_by' => Auth::id()]);
        $evaluation->update(['seat_fit' => $evaluation->fresh()->computeSeatFit($standard)]);

        return back()->with('message', 'Evaluasi diperbarui.');
    }

    public function destroy(Evaluation $evaluation)
    {
        $this->requireLeader();

        $teamId      = TenantContext::teamId();
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgTeamIds  = Team::withoutGlobalScopes()
            ->where('organization_id', $currentTeam->organization_id)
            ->pluck('id');

        abort_unless(
            $orgTeamIds->contains($evaluation->team_id),
            403,
            'Evaluasi bukan milik organisasi aktif.',
        );

        $evaluation->delete();
        return back()->with('message', 'Evaluasi dihapus.');
    }

    // --- Standard (bare minimum) CRUD ---

    public function upsertStandard(Request $request)
    {
        $this->requireLeader();
        $teamId = TenantContext::teamId();

        $validated = $request->validate([
            'min_plus'       => 'required|integer|min:0',
            'max_plus_minus' => 'required|integer|min:0',
            'max_minus'      => 'required|integer|min:0',
            'gwc_get'        => 'required|boolean',
            'gwc_want'       => 'required|boolean',
            'gwc_capacity'   => 'required|string|in:Y,N',
        ]);

        PeopleAnalyzerStandard::updateOrCreate(
            ['team_id' => $teamId],
            [...$validated, 'updated_by' => Auth::id()],
        );

        return back()->with('message', 'Standard diperbarui.');
    }
}
