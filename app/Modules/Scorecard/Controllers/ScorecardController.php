<?php

namespace App\Modules\Scorecard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Scorecard\Actions\CreateMetric;
use App\Modules\Scorecard\Actions\LogWeeklyScore;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Resources\MetricResource;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class ScorecardController extends Controller
{
    public function index(Request $request)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $users = User::inTeam($teamId);

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
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $role   = $request->user()->roleIn($teamId);

        if ($role !== 'leader' && !$request->user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa membuat metric.');
        }

        $validated = $request->validate([
            'title'               => 'required|string|max:255',
            'owner_id'            => ['required', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'goal_value'          => 'required|numeric',
            'comparison_operator' => 'required|in:>=,<=,==',
            'frequency'           => 'nullable|in:weekly,monthly',
        ]);

        $validated['team_id'] = $teamId;
        $createMetric->execute($validated);

        return back()->with('message', 'Metric dibuat.');
    }

    public function update(Request $request, Metric $metric)
    {
        $teamId = TenantContext::teamId();
        abort_unless($metric->team_id === $teamId, 403, 'Metric bukan milik team aktif.');
        $role   = $request->user()->roleIn($teamId);

        if ($role !== 'leader' && !$request->user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa mengedit metric.');
        }

        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'owner_id'            => ['sometimes', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'goal_value'          => 'sometimes|numeric',
            'comparison_operator' => 'sometimes|in:>=,<=,==',
            'frequency'           => 'nullable|in:weekly,monthly',
        ]);

        $metric->update($validated);

        return back()->with('message', 'Metric diperbarui.');
    }

    public function destroy(Metric $metric)
    {
        $teamId = TenantContext::teamId();
        abort_unless($metric->team_id === $teamId, 403, 'Metric bukan milik team aktif.');
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa menghapus metric.');
        }

        $metric->delete();
        return back()->with('message', 'Metric deleted');
    }

    public function updateSettings(Request $request)
    {
        $teamId = TenantContext::teamId();
        $user   = $request->user();
        $role   = $user->roleIn($teamId);

        if (!$user->isAdminOfActiveOrg() && $role !== 'leader') {
            abort(403);
        }

        $validated = $request->validate([
            'q1_start_date' => 'required|date',
            'scorecard_day' => 'required|integer|min:0|max:6',
        ]);

        \App\Modules\Teams\Models\Team::withoutGlobalScopes()
            ->where('id', $teamId)
            ->update($validated);

        // ponytail: dispatch regeneration async instead of inline — prevents write-on-GET
        // race when multiple users hit /events simultaneously.
        $team = \App\Modules\Teams\Models\Team::withoutGlobalScopes()->find($teamId);
        if ($team) {
            \App\Jobs\RegenerateTeamEvents::dispatch($team);
        }

        return back()->with('message', 'Settings disimpan & event otomatis sinkron.');
    }

    public function logScore(Request $request, LogWeeklyScore $logWeeklyScore)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $userId = $request->user()->id;
        $role   = $request->user()->roleIn($teamId);

        $validated = $request->validate([
            'metric_id'       => 'required|exists:metrics,id',
            'week_start_date' => 'required|date',
            'actual_value'    => 'required|numeric',
        ]);

        $metric = Metric::withoutGlobalScopes()
            ->where('id', $validated['metric_id'])
            ->where('team_id', $teamId)
            ->firstOrFail();

        if ($role !== 'leader' && !$request->user()->isAdminOfActiveOrg() && $metric->owner_id !== $userId) {
            abort(403, 'Kamu hanya bisa input score untuk metricmu sendiri.');
        }

        $validated['created_by'] = $userId;
        $logWeeklyScore->execute($validated);

        return back()->with('message', 'Score diperbarui.');
    }
}
