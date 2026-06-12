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
            'rocks_total'     => Rock::count(),
            'rocks_on_track'  => Rock::where('status', 'on_track')->count(),
            'rocks_off_track' => Rock::where('status', 'off_track')->count(),
            'rocks_done'      => Rock::where('status', 'done')->count(),
            'issues_open'     => Issue::where('status', 'open')->count(),
            'todos_overdue'   => ToDo::where('is_completed', false)
                                     ->where('due_date', '<', now()->toDateString())
                                     ->count(),
            'scorecard_red'   => 0,
        ] : [];

        return Inertia::render('Dashboard', ['stats' => $stats]);
    }
}
