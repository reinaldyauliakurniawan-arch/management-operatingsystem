<?php

namespace App\Modules\Leaderboard\Actions;

use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\ToDo\Models\ToDo;
use App\Modules\Event\Models\EventAttendance;
use App\Modules\Event\Models\Event;

class CalculateLeaderboardScores
{
    public function execute(?int $teamId = null, ?string $dateFrom = null, ?string $dateTo = null): \Illuminate\Support\Collection
    {
        $teamId = $teamId ?? session('active_team_id');
        if (!$teamId) return collect();

        $team = Team::find($teamId);
        if (!$team) return collect();

        $members  = TeamMember::with('user')->where('team_id', $teamId)->get();
        $params   = LeaderboardParameter::withoutGlobalScopes()->where('team_id', $teamId)->get();

        $results = $members->map(function ($member) use ($params, $teamId, $dateFrom, $dateTo) {
            $user       = $member->user;
            $role       = $member->role;
            $userId     = $user->id;

            $totalPoints    = 0;
            $maxPoints      = 0;
            $breakdown      = [];

            foreach ($params as $param) {
                // Skip if parameter not assigned to this role
                if (!in_array($role, $param->assigned_roles ?? [])) continue;

                $maxPoints += $param->max_points;

                if ($param->is_automatic) {
                    $earned = $this->calcAutomatic($param->automatic_source, $userId, $teamId, $param->max_points, $dateFrom, $dateTo);
                } else {
                    $earned = LeaderboardEntry::withoutGlobalScopes()
                        ->where('team_id', $teamId)
                        ->where('parameter_id', $param->id)
                        ->where('user_id', $userId)
                        ->sum('points');
                    $earned = min($earned, $param->max_points);
                }

                $totalPoints += $earned;
                $breakdown[] = [
                    'parameter'  => $param->name,
                    'earned'     => round($earned, 2),
                    'max'        => $param->max_points,
                    'automatic'  => $param->is_automatic,
                ];
            }

            $score = $maxPoints > 0 ? round(($totalPoints / $maxPoints) * 100, 1) : 0;

            return [
                'user_id'    => $userId,
                'name'       => $user->name,
                'role'       => $role,
                'score'      => $score,
                'breakdown'  => $breakdown,
            ];
        });

        return $results->sortBy([
            ['score', 'desc'],
            ['user_id', 'asc'],
        ])->values();
    }

    private function calcAutomatic(string $source, int $userId, int $teamId, float $maxPoints, ?string $dateFrom = null, ?string $dateTo = null): float
    {
        return match ($source) {
            'rocks'      => $this->rocksScore($userId, $teamId, $maxPoints, $dateFrom, $dateTo),
            'scorecard'  => $this->scorecardScore($userId, $teamId, $maxPoints, $dateFrom, $dateTo),
            'todos'      => $this->todosScore($userId, $teamId, $maxPoints, $dateFrom, $dateTo),
            'events'     => $this->eventsScore($userId, $teamId, $maxPoints, $dateFrom, $dateTo),
            'leadership' => $this->leadershipScore($userId, $teamId, $maxPoints),
            default      => 0,
        };
    }

    private function rocksScore(int $userId, int $teamId, float $max, ?string $dateFrom = null, ?string $dateTo = null): float
    {
        $q = Rock::withoutGlobalScopes()->where('team_id', $teamId)->where('owner_id', $userId);
        if ($dateFrom) $q->where('created_at', '>=', $dateFrom);
        if ($dateTo)   $q->where('created_at', '<=', $dateTo);
        $total = (clone $q)->count();
        if ($total === 0) return 0;
        $done = (clone $q)->where('status', 'done')->count();
        return round(($done / $total) * $max, 2);
    }

    private function scorecardScore(int $userId, int $teamId, float $max, ?string $dateFrom = null, ?string $dateTo = null): float
    {
        $metrics = Metric::withoutGlobalScopes()->where('team_id', $teamId)->where('owner_id', $userId)
            ->with(['scores' => function ($q) use ($dateFrom, $dateTo) {
                if ($dateFrom) $q->where('week_start_date', '>=', $dateFrom);
                if ($dateTo)   $q->where('week_start_date', '<=', $dateTo);
            }])->get();
        if ($metrics->isEmpty()) return 0;
        $totalScores = 0;
        $greenScores = 0;
        foreach ($metrics as $metric) {
            foreach ($metric->scores as $score) {
                $totalScores++;
                if ($score->status === 'green') $greenScores++;
            }
        }
        if ($totalScores === 0) return 0;
        return round(($greenScores / $totalScores) * $max, 2);
    }

    private function todosScore(int $userId, int $teamId, float $max, ?string $dateFrom = null, ?string $dateTo = null): float
    {
        $q = ToDo::withoutGlobalScopes()->where('team_id', $teamId)->where('owner_id', $userId);
        if ($dateFrom) $q->where('created_at', '>=', $dateFrom);
        if ($dateTo)   $q->where('created_at', '<=', $dateTo);
        $total = (clone $q)->count();
        if ($total === 0) return 0;
        $done = (clone $q)->where('is_completed', true)->count();
        return round(($done / $total) * $max, 2);
    }

    private function eventsScore(int $userId, int $teamId, float $max, ?string $dateFrom = null, ?string $dateTo = null): float
    {
        $role = \App\Modules\Teams\Models\TeamMember::where('team_id', $teamId)
            ->where('user_id', $userId)
            ->value('role');

        $eventsQuery = Event::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->where(function ($q) use ($role) {
                $q->whereNull('assigned_roles')
                  ->orWhereJsonContains('assigned_roles', $role);
            });
        if ($dateFrom) $eventsQuery->where('event_date', '>=', $dateFrom);
        if ($dateTo)   $eventsQuery->where('event_date', '<=', $dateTo);

        $totalEvents = $eventsQuery->count();
        if ($totalEvents === 0) return 0;

        $attended = EventAttendance::withoutGlobalScopes()
            ->whereHas('event', fn($q) => $q->withoutGlobalScopes()
                ->where('team_id', $teamId)
                ->where(function ($q2) use ($role) {
                    $q2->whereNull('assigned_roles')
                       ->orWhereJsonContains('assigned_roles', $role);
                })
                ->when($dateFrom, fn($q3) => $q3->where('event_date', '>=', $dateFrom))
                ->when($dateTo,   fn($q3) => $q3->where('event_date', '<=', $dateTo))
            )
            ->where('user_id', $userId)
            ->where('attended', true)
            ->count();

        return round(($attended / $totalEvents) * $max, 2);
    }

    private function leadershipScore(int $userId, int $teamId, float $max): float
    {
        // Get the latest closed cycle for this team
        $latestCycle = \App\Modules\LeadershipAssessment\Models\AssessmentCycle::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->where('status', 'closed')
            ->latest()
            ->first();

        if (!$latestCycle) return 0;

        $responses = \App\Modules\LeadershipAssessment\Models\AssessmentResponse::where('cycle_id', $latestCycle->id)
            ->where('assessee_id', $userId)
            ->get();

        if ($responses->isEmpty()) return 0;

        // Scale: avg rubric level (1-5) → normalized to max_points
        $avgLevel = $responses->avg('rubric_level'); // 1.0–5.0
        return round((($avgLevel - 1) / 4) * $max, 2); // 0 at level 1, max at level 5
    }
}
