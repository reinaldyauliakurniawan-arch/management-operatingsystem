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
        $metrics = Metric::with(['owner', 'scores' => fn($q) => $q->orderBy('week_start_date', 'desc')])->where('team_id', $teamId)->latest()->get();
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        $now = Carbon::now();
        $year = (int) $request->query('year', $now->year);
        $quarter = (int) $request->query('quarter', intdiv($now->month - 1, 3) + 1);
        $quarter = max(1, min(4, $quarter));

        // Bulan awal quarter (Q1=Jan, Q2=Apr, Q3=Jul, Q4=Okt)
        $startMonth = (($quarter - 1) * 3) + 1;
        $quarterStart = Carbon::create($year, $startMonth, 1)->startOfWeek();
        $quarterEnd = $quarterStart->copy()->addMonths(3)->subDay();

        // Generate semua minggu dalam quarter tersebut, urutan kronologis (lama -> baru)
        $weeks = [];
        $cursor = $quarterStart->copy();
        while ($cursor->lte($quarterEnd)) {
            $weeks[] = $cursor->format('Y-m-d');
            $cursor->addWeek();
        }

        return Inertia::render('Scorecard/Index', [
            'metrics' => MetricResource::collection($metrics),
            'users' => $users,
            'weeks' => $weeks,
            'filters' => [
                'year' => $year,
                'quarter' => $quarter,
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
