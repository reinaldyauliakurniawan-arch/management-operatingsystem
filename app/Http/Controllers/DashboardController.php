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
        $teamId = session("active_team_id");
        $userId = auth()->id();

        $role = $teamId
            ? auth()
                ->user()
                ->teamMemberships()
                ->where("team_id", $teamId)
                ->value("role")
            : null;

        // Org admin yang sekaligus leader di active team → pastikan role terbaca
        if (!$role && $teamId && auth()->user()->is_org_admin) {
            $role = "leader";
        }

        $stats = $teamId
            ? $this->buildStats($teamId, $userId, $role)
            : [
                "rocks_total" => 0,
                "rocks_on_track" => 0,
                "rocks_off_track" => 0,
                "rocks_done" => 0,
                "my_rocks" => [],
                "issues_open" => 0,
                "todos_overdue" => 0,
                "todos_due_today" => 0,
                "scorecard_red" => 0,
            ];

        $upcomingMeeting =
            $teamId && $role === "leader"
                ? \App\Modules\L10Meeting\Models\Meeting::where(
                    "team_id",
                    $teamId,
                )
                    ->whereNull("started_at")
                    ->whereNotNull("scheduled_at")
                    ->where("scheduled_at", ">=", now())
                    ->orderBy("scheduled_at")
                    ->first()
                : null;

        $upcomingEvents = $teamId
            ? \App\Modules\Event\Models\Event::where("team_id", $teamId)
                ->where("event_date", ">=", now()->toDateString())
                ->where("event_date", "<=", now()->addDays(7)->toDateString())
                ->orderBy("event_date")
                ->get(["id", "name", "type", "event_date", "assigned_roles"])
                ->filter(fn($event) => $this->eventVisibleToRole($event, $role))
                ->map(
                    fn($event) => $event->only([
                        "id",
                        "name",
                        "type",
                        "event_date",
                    ]),
                )
                ->values()
            : collect();

        $leaderboardTop3ByRole = [];
        if ($teamId && $role === "leader") {
            $calculator = app(
                \App\Modules\Leaderboard\Actions\CalculateLeaderboardScores::class,
            );
            $quarter = "Q" . (int) ceil(now()->month / 3);
            $all = $calculator->execute($teamId, $quarter, now()->year);

            foreach (["leader", "member", "tutor"] as $roleKey) {
                $roleEntries = $all
                    ->filter(fn($e) => $e["role"] === $roleKey)
                    ->values();
                if ($roleEntries->isNotEmpty()) {
                    $leaderboardTop3ByRole[$roleKey] = $roleEntries
                        ->take(3)
                        ->values()
                        ->all();
                }
            }
        }

        $selfLeaderboard = null;
        if ($teamId && in_array($role, ["member", "tutor"])) {
            $calculator = app(
                \App\Modules\Leaderboard\Actions\CalculateLeaderboardScores::class,
            );
            $quarter = "Q" . (int) ceil(now()->month / 3);
            $all = $calculator->execute($teamId, $quarter, now()->year);
            $selfEntry = $all->firstWhere("user_id", $userId);
            if ($selfEntry) {
                $sameRole = $all
                    ->filter(fn($e) => $e["role"] === $role)
                    ->values();
                $rankIndex = $sameRole->search(
                    fn($e) => $e["user_id"] === $userId,
                );
                $rank = $rankIndex !== false ? $rankIndex + 1 : null;
                $selfLeaderboard = [
                    "score" => $selfEntry["total"],
                    "rank" => $rank,
                    "total" => $sameRole->count(),
                ];
            }
        }

        return Inertia::render("Dashboard", [
            "stats" => $stats,
            "role" => $role,
            "upcomingMeeting" => $upcomingMeeting
                ? [
                    "id" => $upcomingMeeting->id,
                    "title" => $upcomingMeeting->title,
                    "scheduled_at" => $upcomingMeeting->scheduled_at?->format(
                        "Y-m-d H:i:s",
                    ),
                ]
                : null,
            "upcomingEvents" => $upcomingEvents,
            "leaderboardTop3ByRole" => $leaderboardTop3ByRole,
            "selfLeaderboard" => $selfLeaderboard,
        ]);
    }

    private function buildStats(int $teamId, int $userId, ?string $role): array
    {
        $rocksQuery = Rock::where("team_id", $teamId);
        $todosQuery = ToDo::where("team_id", $teamId)->where(
            "is_completed",
            false,
        );

        if ($role !== "leader") {
            $rocksQuery->where("owner_id", $userId);
            $todosQuery->where("owner_id", $userId);
        }

        $metrics = \App\Modules\Scorecard\Models\Metric::where(
            "team_id",
            $teamId,
        )
            ->with(["latestScore"])
            ->get();

        $scorecardRed = $metrics
            ->filter(function ($metric) {
                $latestScore = $metric->latestScore;

                return $latestScore && $latestScore->status === "red";
            })
            ->count();

        $myRocks =
            $role !== "leader"
                ? (clone $rocksQuery)
                    ->get(["id", "title", "status"])
                    ->map(
                        fn($rock) => [
                            "id" => $rock->id,
                            "title" => $rock->title,
                            "status" => $rock->status,
                        ],
                    )
                    ->values()
                    ->all()
                : [];

        return [
            "rocks_total" => (clone $rocksQuery)->count(),
            "rocks_on_track" => (clone $rocksQuery)
                ->where("status", "on_track")
                ->count(),
            "rocks_off_track" => (clone $rocksQuery)
                ->where("status", "off_track")
                ->count(),
            "rocks_done" => (clone $rocksQuery)
                ->where("status", "done")
                ->count(),
            "my_rocks" => $myRocks,
            "issues_open" =>
                $role === "leader"
                    ? Issue::where("team_id", $teamId)
                        ->where("status", "open")
                        ->count()
                    : 0,
            "todos_overdue" => (clone $todosQuery)
                ->whereDate("due_date", "<", today())
                ->count(),
            "todos_due_today" => (clone $todosQuery)
                ->whereDate("due_date", today())
                ->count(),
            "scorecard_red" => $role === "leader" ? $scorecardRed : 0,
        ];
    }

    private function eventVisibleToRole(
        \App\Modules\Event\Models\Event $event,
        ?string $role,
    ): bool {
        if ($role === "leader") {
            return true;
        }

        $assignedRoles = $event->assigned_roles ?? [];

        if (empty($assignedRoles)) {
            return true;
        }

        return $role !== null && in_array($role, $assignedRoles, true);
    }
}
