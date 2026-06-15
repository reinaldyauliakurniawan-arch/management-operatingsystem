<?php

namespace App\Modules\Scorecard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Scorecard\Actions\CreateMetric;
use App\Modules\Scorecard\Actions\LogWeeklyScore;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Resources\MetricResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ScorecardController extends Controller
{
    public function index(Request $request)
    {
        $teamId = session('active_team_id');
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        // Load team settings
        $team = \App\Modules\Teams\Models\Team::withoutGlobalScopes()->find($teamId);
        $scorecardDay = $team?->scorecard_day ?? 1; // default Senin
        $q1StartDate  = $team?->q1_start_date
            ? Carbon::parse($team->q1_start_date)
            : Carbon::create(Carbon::now()->year, 1, 1); // fallback Jan 1

        $now     = Carbon::now();
        $quarter = (int) $request->query('quarter', 1);

        // Hitung awal tiap quarter berdasarkan q1_start_date (per 13 minggu)
        $quarterStart = $q1StartDate->copy()->addWeeks(($quarter - 1) * 13);
        $quarterEnd   = $quarterStart->copy()->addWeeks(13)->subDay();

        // Auto-detect quarter aktif jika tidak ada query
        if (!$request->has('quarter')) {
            for ($q = 4; $q >= 1; $q--) {
                $qs = $q1StartDate->copy()->addWeeks(($q - 1) * 13);
                $qe = $qs->copy()->addWeeks(13)->subDay();
                if ($now->between($qs, $qe)) {
                    $quarter      = $q;
                    $quarterStart = $qs;
                    $quarterEnd   = $qe;
                    break;
                }
            }
        }

        $quarter = max(1, min(4, $quarter));

        $metrics = Metric::with([
            'owner',
            'scores' => fn ($q) => $q
                ->whereBetween('week_start_date', [
                    $quarterStart->toDateString(),
                    $quarterEnd->toDateString(),
                ])
                ->orderBy('week_start_date', 'desc'),
        ])->where('team_id', $teamId)->latest()->get();

        // Generate minggu berdasarkan scorecard_day
        $weeks  = [];
        $cursor = $quarterStart->copy()->startOfWeek(Carbon::MONDAY);
        // Geser ke hari evaluasi yang dipilih
        $cursor->addDays($scorecardDay === 0 ? 6 : $scorecardDay - 1);
        if ($cursor->lt($quarterStart)) $cursor->addWeek();

        while ($cursor->lte($quarterEnd)) {
            $weeks[] = $cursor->format('Y-m-d');
            $cursor->addWeek();
        }

        return Inertia::render('Scorecard/Index', [
            'metrics'         => MetricResource::collection($metrics),
            'users'           => $users,
            'weeks'           => $weeks,
            'filters'         => ['quarter' => $quarter],
            'scorecardSettings' => [
                'q1_start_date' => $q1StartDate->format('Y-m-d'),
                'scorecard_day' => $scorecardDay,
            ],
        ]);
    }

    public function store(Request $request, CreateMetric $createMetric)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat metric.');
        }

        $validated = $request->validate([
            'title'               => 'required|string|max:255',
            'owner_id'            => 'required|exists:users,id',
            'goal_value'          => 'required|numeric',
            'comparison_operator' => 'required|in:>=,<=,==',
            'frequency'           => 'nullable|in:weekly,monthly',
        ]);

        // HasTeam trait auto-injects team_id via session, tapi explicit lebih aman
        $validated['team_id'] = $teamId;
        $createMetric->execute($validated);

        return back()->with('message', 'Metric dibuat.');
    }

    public function update(Request $request, Metric $metric)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa mengedit metric.');
        }

        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'owner_id'            => 'sometimes|exists:users,id',
            'goal_value'          => 'sometimes|numeric',
            'comparison_operator' => 'sometimes|in:>=,<=,==',
            'frequency'           => 'nullable|in:weekly,monthly',
        ]);

        $metric->update($validated);

        return back()->with('message', 'Metric diperbarui.');
    }

    public function destroy(Metric $metric)
    {
        $teamId = session('active_team_id');
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa menghapus metric.');
        }

        $metric->delete();
        return back()->with('message', 'Metric deleted');
    }

    public function updateSettings(Request $request)
    {
        $teamId = session('active_team_id');
        $user   = $request->user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->is_org_admin && $role !== 'leader') {
            abort(403);
        }

        $validated = $request->validate([
            'q1_start_date' => 'required|date',
            'scorecard_day' => 'required|integer|min:0|max:6',
        ]);

        \App\Modules\Teams\Models\Team::withoutGlobalScopes()
            ->where('id', $teamId)
            ->update($validated);

        return back()->with('message', 'Settings disimpan.');
    }

    public function updateSettings(Request $request)
    {
        $teamId = session('active_team_id');
        $user   = $request->user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->is_org_admin && $role !== 'leader') {
            abort(403);
        }

        $validated = $request->validate([
            'q1_start_date' => 'required|date',
            'scorecard_day' => 'required|integer|min:0|max:6',
        ]);

        \App\Modules\Teams\Models\Team::withoutGlobalScopes()
            ->where('id', $teamId)
            ->update($validated);

        return back()->with('message', 'Settings disimpan.');
    }

    public function logScore(Request $request, LogWeeklyScore $logWeeklyScore)
    {
        $teamId = session('active_team_id');
        $userId = $request->user()->id;
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        $validated = $request->validate([
            'metric_id'       => 'required|exists:metrics,id',
            'week_start_date' => 'required|date',
            'actual_value'    => 'required|numeric',
        ]);

        // Verifikasi metric milik team aktif
        $metric = Metric::withoutGlobalScopes()
            ->where('id', $validated['metric_id'])
            ->where('team_id', $teamId)
            ->firstOrFail();

        // Member/tutor hanya bisa input untuk metric yang di-assign ke mereka
        if ($role !== 'leader' && $metric->owner_id !== $userId) {
            abort(403, 'Kamu hanya bisa input score untuk metricmu sendiri.');
        }

        $validated['created_by'] = $userId;
        $logWeeklyScore->execute($validated);

        return back()->with('message', 'Score diperbarui.');
    }
}
