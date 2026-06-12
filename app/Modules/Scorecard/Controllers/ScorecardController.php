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
    public function index()
    {
        $teamId = session('active_team_id');
        $metrics = Metric::with('owner', 'scores')->where('team_id', $teamId)->latest()->get();
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        // Generate last 13 weeks
        $weeks = [];
        for ($i = 0; $i < 13; $i++) {
            $weeks[] = Carbon::now()->startOfWeek()->subWeeks($i)->format('Y-m-d');
        }

        return Inertia::render('Scorecard/Index', [
            'metrics' => MetricResource::collection($metrics),
            'users' => $users,
            'weeks' => $weeks,
        ]);
    }

    public function store(Request $request, CreateMetric $createMetric)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'owner_id' => 'required|exists:users,id',
            'goal_value' => 'required|numeric',
            'comparison_operator' => 'required|in:>=,<=,==',
        ]);

        $createMetric->execute($validated);

        return back()->with('message', 'Metric created');
    }

    public function logScore(Request $request, LogWeeklyScore $logWeeklyScore)
    {
        $validated = $request->validate([
            'metric_id' => 'required|exists:metrics,id',
            'week_start_date' => 'required|date',
            'actual_value' => 'required|numeric',
        ]);

        $logWeeklyScore->execute($validated);

        return back()->with('message', 'Score updated');
    }
}
