<?php

namespace App\Modules\Leaderboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leaderboard\Actions\CalculateLeaderboardScores;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request, CalculateLeaderboardScores $calc)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $year   = (int) $request->input('year', now()->year);
        $quarter = $request->input('quarter', 'Q' . ceil(now()->month / 3));
        $view   = $request->input('view', 'all_management');

        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId       = $currentTeam->organization_id;
        $orgTeamIds  = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');

        // ponytail: dropdown "Input Poin" sekarang menampilkan SEMUA member di org,
        // bukan cuma member team aktif. Sebelumnya HR hanya bisa pilih Dewi & Sandrina
        // (member team aktif) — padahal parameter seperti "Training" atau "Komen Sosmed"
        // berlaku untuk semua member di org. Dedupe by user_id karena satu user bisa
        // jadi member di multiple team.
        $members = TeamMember::with('user')
            ->whereIn('team_id', $orgTeamIds)
            ->get()
            ->unique('user_id')
            ->map(fn($m) => [
                'id'   => $m->user_id,
                'name' => $m->user->name,
                'role' => $m->role,
            ])
            ->sortBy('name')
            ->values();

        // ponytail: parameters juga di-query org-wide supaya sinkron antar team.
        // Sebelumnya HR di team A bikin parameter "Training" → cuma kelihatan di team A,
        // sehingga "sinkronisasi" antar team rusak. Sekarang parameter satu org share.
        $parameters = LeaderboardParameter::whereIn('team_id', $orgTeamIds)
            ->orderBy('scheme')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->unique(fn($p) => $p->scheme . '|' . $p->name);
            ->values();

        $orgTeams = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->get()
            ->map(fn($t) => ['id' => $t->id, 'name' => $t->name]);

        if ($view === 'per_team') {
            $selectedTeamId = (int) $request->input('selected_team_id', $teamId);
            if (!$orgTeamIds->contains($selectedTeamId)) {
                $selectedTeamId = $teamId;
            }
            $scores = $calc->execute($selectedTeamId, $quarter, $year);
        } elseif ($view === 'all_tutors') {
            $scores = $calc->executeAcrossTeams($orgTeamIds->toArray(), $quarter, $year, 'tutor');
        } else {
            $scores = $calc->executeAcrossTeams($orgTeamIds->toArray(), $quarter, $year, 'management');
        }

        $selectedTeamId = $view === 'per_team'
            ? (int) $request->input('selected_team_id', $teamId)
            : $teamId;
        if (!$orgTeamIds->contains($selectedTeamId)) {
            $selectedTeamId = $teamId;
        }

        return Inertia::render('Leaderboard/Index', [
            'scores'     => $scores,
            'parameters' => $parameters,
            'members'    => $members,
            'orgTeams'   => $orgTeams,
            'filters'    => [
                'year'            => $year,
                'quarter'         => $quarter,
                'view'            => $view,
                'selected_team_id' => $selectedTeamId,
            ],
        ]);
    }

    // --- Parameters ---

    public function storeParameter(Request $request)
    {
        $this->requireLeader();
        $v = $request->validate([
            'scheme'     => 'required|in:tutor,management',
            'name'       => 'required|string|max:255',
            'input_type' => 'required|in:per_unit,tiered,normalized,auto',
            'config'     => 'nullable|array',
            'sort_order' => 'integer|min:0',
        ]);
        $v['team_id']    = TenantContext::teamId();
        $v['created_by'] = Auth::id();
        LeaderboardParameter::create($v);
        return back()->with('message', 'Parameter ditambah.');
    }

    public function updateParameter(Request $request, LeaderboardParameter $parameter)
    {
        $this->requireLeader();
        $this->ensureParameterInActiveOrg($parameter);

        $v = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'input_type' => 'sometimes|in:per_unit,tiered,normalized,auto',
            'config'     => 'nullable|array',
            'sort_order' => 'sometimes|integer|min:0',
        ]);
        $v['updated_by'] = Auth::id();
        $parameter->update($v);
        return back()->with('message', 'Parameter diperbarui.');
    }

    public function destroyParameter(LeaderboardParameter $parameter)
    {
        $this->requireLeader();
        $this->ensureParameterInActiveOrg($parameter);
        $parameter->delete();
        return back()->with('message', 'Parameter dihapus.');
    }

    // --- Entries ---

    public function storeEntry(Request $request)
    {
        $this->requireLeader();

        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId       = $currentTeam->organization_id;
        $orgTeamIds  = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');

        $v = $request->validate([
            'parameter_id' => 'required|exists:leaderboard_parameters,id',
            // ponytail: user_id sekarang divalidasi sebagai member di org aktif
            // (bukan cuma team aktif) — fix bug "pilihan user cuma Dewi dan Sandrina".
            'user_id'      => [
                'required',
                Rule::exists('users', 'id')->where(function ($q) use ($orgTeamIds) {
                    $q->whereHas('teamMemberships', fn($q2) => $q2->whereIn('team_id', $orgTeamIds));
                }),
            ],
            'quarter'   => 'required|in:Q1,Q2,Q3,Q4',
            'year'      => 'required|integer|min:2020|max:2099',
            'raw_value' => 'required|numeric',
            'notes'     => 'nullable|string|max:500',
        ]);

        // ponytail: parameter di-lookup dari semua team di org (bukan cuma team aktif)
        // supaya parameter yang di-create di team lain tetap bisa dipakai untuk input poin.
        $param = LeaderboardParameter::whereIn('team_id', $orgTeamIds)
            ->where('id', $v['parameter_id'])
            ->firstOrFail();

        $points = $param->calculatePoints((float) $v['raw_value']);

        // ponytail: entry.team_id pakai team_id dari parameter, BUKAN session team_id.
        // Sebelumnya entry selalu di-save dengan team_id = session team_id, padahal
        // parameter mungkin milik team lain di org yang sama → entry gak akan ketemu
        // saat query (karena lookup juga per-team) → "gak ke save" symptom.
        LeaderboardEntry::updateOrCreate(
            [
                'team_id'      => $param->team_id,
                'parameter_id' => $v['parameter_id'],
                'user_id'      => $v['user_id'],
                'quarter'      => $v['quarter'],
                'year'         => $v['year'],
            ],
            [
                'raw_value'  => $v['raw_value'],
                'points'     => $points,
                'notes'      => $v['notes'] ?? null,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ],
        );

        return back()->with('message', 'Poin disimpan.');
    }

    public function updateEntry(Request $request, LeaderboardEntry $entry)
    {
        $this->requireLeader();
        $this->ensureEntryInActiveOrg($entry);

        $v = $request->validate([
            'raw_value' => 'required|numeric',
            'notes'     => 'nullable|string|max:500',
        ]);
        $points = $entry->parameter->calculatePoints((float) $v['raw_value']);
        $entry->update([
            'raw_value'  => $v['raw_value'],
            'points'     => $points,
            'notes'      => $v['notes'] ?? null,
            'updated_by' => Auth::id(),
        ]);
        return back()->with('message', 'Entry diperbarui.');
    }

    public function destroyEntry(LeaderboardEntry $entry)
    {
        $this->requireLeader();
        $this->ensureEntryInActiveOrg($entry);
        $entry->delete();
        return back()->with('message', 'Entry dihapus.');
    }

    public function recalculate(Request $request)
    {
        $this->requireLeader();
        $v = $request->validate([
            'quarter' => 'required|in:Q1,Q2,Q3,Q4',
            'year'    => 'required|integer',
        ]);

        $teamId = TenantContext::teamId();
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgId      = $currentTeam->organization_id;
        $orgTeamIds = Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id');

        // ponytail: recalculate semua entry di org (bukan cuma team aktif) supaya
        // sinkron dengan cara kerja index() dan storeEntry() yang sekarang org-wide.
        $entries = LeaderboardEntry::whereIn('team_id', $orgTeamIds)
            ->where('quarter', $v['quarter'])
            ->where('year', $v['year'])
            ->with('parameter')
            ->get();

        foreach ($entries as $entry) {
            $entry->update([
                'points'     => $entry->parameter->calculatePoints($entry->raw_value),
                'updated_by' => Auth::id(),
            ]);
        }

        return back()->with('message', "Recalculate {$v['quarter']} {$v['year']} selesai.");
    }

    private function requireLeader(): void
    {
        $user = Auth::user();
        if ($user->isAdminOfActiveOrg()) return;

        $teamId = TenantContext::teamId();
        $role   = $user->roleIn($teamId);
        abort_if($role !== 'leader', 403);
    }

    /**
     * ponytail: defense-in-depth — pastikan parameter yang diakses memang milik
     * salah satu team di org aktif. Cegah cross-org mutation walau token dibocor.
     */
    private function ensureParameterInActiveOrg(LeaderboardParameter $parameter): void
    {
        $teamId      = TenantContext::teamId();
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgTeamIds  = Team::withoutGlobalScopes()
            ->where('organization_id', $currentTeam->organization_id)
            ->pluck('id');

        abort_unless(
            $orgTeamIds->contains($parameter->team_id),
            403,
            'Parameter bukan milik organisasi aktif.',
        );
    }

    private function ensureEntryInActiveOrg(LeaderboardEntry $entry): void
    {
        $teamId      = TenantContext::teamId();
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgTeamIds  = Team::withoutGlobalScopes()
            ->where('organization_id', $currentTeam->organization_id)
            ->pluck('id');

        abort_unless(
            $orgTeamIds->contains($entry->team_id),
            403,
            'Entry bukan milik organisasi aktif.',
        );
    }
}
