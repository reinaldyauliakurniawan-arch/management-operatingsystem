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
        $userId = auth()->id();

        $role = $teamId
            ? auth()->user()->teamMemberships()->where('team_id', $teamId)->value('role')
            : null;

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
            'scorecard_red'   => (function() use ($teamId) {
                // FIX: subquery ROW_NUMBER untuk ambil 1 score terbaru per metric
                $metrics = \App\Modules\Scorecard\Models\Metric::where('team_id', $teamId)
                    ->with(['latestScore'])
                    ->get();

                return $metrics->filter(function($metric) {
                    $latestScore = $metric->latestScore;
                    return $latestScore && $latestScore->status === 'red';
                })->count();
            })(),
        ] : [];

        $upcomingMeeting = $teamId
            ? \App\Modules\L10Meeting\Models\Meeting::where('team_id', $teamId)
                ->whereNull('started_at')
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '>=', now())
                ->orderBy('scheduled_at')
                ->first()
            : null;

        $upcomingEvents = $teamId
            ? \App\Modules\Event\Models\Event::where('team_id', $teamId)
                ->where('event_date', '>=', now()->toDateString())
                ->where('event_date', '<=', now()->addDays(7)->toDateString())
                ->orderBy('event_date')
                ->get(['id', 'name', 'type', 'event_date'])
            : collect();

        $leaderboardTop3 = [];
        if ($teamId && $role === 'leader') {
            $calculator = app(\App\Modules\Leaderboard\Actions\CalculateLeaderboardScores::class);
            $leaderboardTop3 = $calculator->execute($teamId)->take(3)->values();
        }

        $selfLeaderboard = null;
        if ($teamId && in_array($role, ['member', 'tutor'])) {
            $calculator = app(\App\Modules\Leaderboard\Actions\CalculateLeaderboardScores::class);
            $all = $calculator->execute($teamId);
            $selfEntry = $all->firstWhere('user_id', $userId);
            if ($selfEntry) {
                $sameRole = $all->where('role', $role)->values();
                $rankIndex = $sameRole->search(fn($e) => $e['user_id'] === $userId);
                // FIX: search() returns false when not found; false + 1 = 1 (wrong rank)
                $rank = $rankIndex !== false ? $rankIndex + 1 : null;
                $selfLeaderboard = [
                    'score' => $selfEntry['score'],
                    'rank'  => $rank,
                    'total' => $sameRole->count(),
                ];
            }
        }

        return Inertia::render('Dashboard', [
            'stats'           => $stats,
            'role'            => $role,
            'upcomingMeeting' => $upcomingMeeting ? [
                'id'           => $upcomingMeeting->id,
                'title'        => $upcomingMeeting->title,
                'scheduled_at' => $upcomingMeeting->scheduled_at?->format('Y-m-d H:i:s'),
            ] : null,
            'upcomingEvents'  => $upcomingEvents,
            'leaderboardTop3' => $leaderboardTop3,
            'selfLeaderboard' => $selfLeaderboard,
        ]);
    }
}
