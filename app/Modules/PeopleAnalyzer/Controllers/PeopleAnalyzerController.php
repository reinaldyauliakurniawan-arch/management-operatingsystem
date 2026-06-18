<?php

namespace App\Modules\PeopleAnalyzer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PeopleAnalyzer\Models\Evaluation;
use App\Modules\PeopleAnalyzer\Models\PeopleAnalyzerStandard;
use App\Models\User;
use App\Modules\VTO\Models\VTOPlan;
use App\Modules\AccountabilityChart\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PeopleAnalyzerController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader') abort(403, 'Hanya leader.');
    }

    public function index()
    {
        $teamId  = session('active_team_id');
        $userId  = Auth::id();
        $role    = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        $standard = PeopleAnalyzerStandard::where('team_id', $teamId)->first();

        // Leader lihat semua evaluasi; member/tutor hanya lihat evaluasi diri sendiri
        $evalsQuery = Evaluation::with('evaluator', 'evaluatee', 'seat')
            ->where('team_id', $teamId);

        if ($role !== 'leader') {
            $evalsQuery->where('evaluatee_id', $userId);
        }

        $evals = $evalsQuery->latest()->get()->map(function ($e) use ($standard) {
            $e->seat_fit_computed = $e->computeSeatFit($standard);
            $e->core_values_scores = $e->core_values_scores ?? [];
            $e->seat_title = $e->seat?->title;
            $e->display_name = $e->is_candidate
                ? ($e->candidate_name ?? 'Kandidat')
                : ($e->evaluatee?->name ?? '—');
            return $e;
        });

        $users = $role === 'leader'
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : collect();

        // Core values dari VTO organisasi
        $team = \App\Modules\Teams\Models\Team::withoutGlobalScopes()->with('organization')->find($teamId);
        $vto = $team?->organization_id
            ? VTOPlan::where('organization_id', $team->organization_id)->first()
            : null;
        $coreValues = $vto?->core_values ?? [];

        // Seats dari accountability chart tim ini
        $seats = Seat::where('team_id', $teamId)->orderBy('title')->get(['id', 'title']);

        return Inertia::render('PeopleAnalyzer/Index', [
            'evaluations' => $evals,
            'users'       => $users,
            'standard'    => $standard,
            'canManage'   => $role === 'leader',
            'vto_core_values' => $coreValues,
            'seats'           => $seats,
        ]);
    }

    public function store(Request $request)
    {
        $this->requireLeader();
        $teamId = session('active_team_id');
        $standard = PeopleAnalyzerStandard::where('team_id', $teamId)->first();

        $validated = $request->validate([
            'evaluatee_id'       => 'nullable|exists:users,id',
            'is_candidate'       => 'boolean',
            'candidate_name'     => 'nullable|string|max:255',
            'seat_id'            => 'nullable|exists:seats,id',
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

        $eval = Evaluation::create([
            ...$validated,
            'team_id'      => $teamId,
            'evaluator_id' => Auth::id(),
            'created_by'   => Auth::id(),
        ]);

        // Auto-compute and store seat_fit
        $eval->update(['seat_fit' => $eval->computeSeatFit($standard)]);

        return back()->with('message', 'Evaluasi disimpan.');
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $this->requireLeader();
        $teamId   = session('active_team_id');
        $standard = PeopleAnalyzerStandard::where('team_id', $teamId)->first();

        $validated = $request->validate([
            'gwc_get'            => 'sometimes|boolean',
            'gwc_want'           => 'sometimes|boolean',
            'gwc_capacity'       => 'sometimes|boolean',
            'core_values_scores' => 'sometimes|array',
            'seat_id'            => 'nullable|exists:seats,id',
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
        $evaluation->delete();
        return back()->with('message', 'Evaluasi dihapus.');
    }

    // --- Standard (bare minimum) CRUD ---

    public function upsertStandard(Request $request)
    {
        $this->requireLeader();
        $teamId = session('active_team_id');

        $validated = $request->validate([
            'min_plus'     => 'required|integer|min:0',
            'max_plus_minus' => 'required|integer|min:0',
            'max_minus'    => 'required|integer|min:0',
            'gwc_get'      => 'required|boolean',
            'gwc_want'     => 'required|boolean',
            'gwc_capacity' => 'required|string|in:Y,N',
        ]);

        PeopleAnalyzerStandard::updateOrCreate(
            ['team_id' => $teamId],
            [...$validated, 'updated_by' => Auth::id()]
        );

        return back()->with('message', 'Standard diperbarui.');
    }
}
