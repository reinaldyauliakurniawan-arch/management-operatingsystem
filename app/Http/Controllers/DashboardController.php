<?php

namespace App\Http\Controllers;

use App\Modules\Rocks\Models\Rock;
use App\Modules\IDS\Models\Issue;
use App\Modules\ToDo\Models\ToDo;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $teamId = session('active_team_id');

        $stats = $teamId ? [
            'rocks_total'     => Rock::where('team_id', $teamId)->count(),
            'rocks_on_track'  => Rock::where('team_id', $teamId)->where('status', 'on_track')->count(),
            'rocks_off_track' => Rock::where('team_id', $teamId)->where('status', 'off_track')->count(),
            'rocks_done'      => Rock::where('team_id', $teamId)->where('status', 'done')->count(),
            'issues_open'     => Issue::where('team_id', $teamId)->where('status', 'open')->count(),
            'todos_overdue'   => ToDo::where('team_id', $teamId)
                                     ->where('is_completed', false)
                                     ->where('due_date', '<', now()->toDateString())
                                     ->count(),
            'scorecard_red'   => \App\Modules\Scorecard\Models\Metric::where('team_id', $teamId)
                                     ->with(['scores' => fn($q) => $q->latest()->limit(1)])
                                     ->get()
                                     ->filter(fn($m) => optional($m->scores->first())->status === 'red')
                                     ->count(),
        ] : [];

        return Inertia::render('Dashboard', ['stats' => $stats]);
    }
}
