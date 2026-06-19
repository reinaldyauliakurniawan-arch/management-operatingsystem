<?php

namespace App\Modules\Leaderboard\Actions;

use App\Modules\Teams\Models\TeamMember;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventAttendance;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;

class CalculateLeaderboardScores
{
    public function executeAcrossTeams(
        array $teamIds,
        string $quarter,
        int $year,
        string $scheme, // "tutor" | "management"
    ): \Illuminate\Support\Collection {
        // Kumpulkan semua member dari semua teams, dedupe by user_id
        $allMembers = TeamMember::with(["user", "team"])
            ->whereIn("team_id", $teamIds)
            ->get()
            ->unique("user_id");

        // Filter by scheme
        $filtered = $allMembers->filter(fn($m) => $this->schemeFor($m->role) === $scheme);

        // Ambil params dari semua teams (gabung)
        $params = LeaderboardParameter::whereIn("team_id", $teamIds)
            ->where("scheme", $scheme)
            ->orderBy("sort_order")
            ->orderBy("id")
            ->get();

        return $filtered
            ->map(function ($member) use ($params, $teamIds, $quarter, $year, $scheme) {
                $userId = $member->user_id;
                $teamId = $member->team_id;
                $breakdown = [];
                $total = 0;

                foreach ($params as $param) {
                    if ($param->input_type === "auto") {
                        $points = $this->calcAuto($param, $userId, $teamId, $quarter, $year);
                    } else {
                        $entry = LeaderboardEntry::where([
                            "parameter_id" => $param->id,
                            "user_id" => $userId,
                            "quarter" => $quarter,
                            "year" => $year,
                        ])->first();
                        $points = $entry ? $entry->points : 0;
                    }

                    $total += $points;
                    $breakdown[] = [
                        "parameter_id" => $param->id,
                        "parameter" => $param->name,
                        "input_type" => $param->input_type,
                        "points" => round($points, 2),
                        "is_auto" => $param->input_type === "auto",
                    ];
                }

                return [
                    "user_id" => $userId,
                    "name" => $member->user->name,
                    "role" => $member->role,
                    "team_name" => $member->team->name ?? null,
                    "scheme" => $scheme,
                    "total" => round($total, 2),
                    "breakdown" => $breakdown,
                ];
            })
            ->sortByDesc("total")
            ->values();
    }

    public function execute(
        int $teamId,
        string $quarter,
        int $year,
    ): \Illuminate\Support\Collection {
        $members = TeamMember::with("user")->where("team_id", $teamId)->get();
        $params = LeaderboardParameter::where("team_id", $teamId)
            ->orderBy("sort_order")
            ->orderBy("id")
            ->get();

        return $members
            ->map(function ($member) use ($params, $teamId, $quarter, $year) {
                $userId = $member->user_id;
                $scheme = $this->schemeFor($member->role);
                $breakdown = [];
                $total = 0;

                foreach ($params->where("scheme", $scheme) as $param) {
                    if ($param->input_type === "auto") {
                        $points = $this->calcAuto(
                            $param,
                            $userId,
                            $teamId,
                            $quarter,
                            $year,
                        );
                    } else {
                        $entry = LeaderboardEntry::where([
                            "team_id" => $teamId,
                            "parameter_id" => $param->id,
                            "user_id" => $userId,
                            "quarter" => $quarter,
                            "year" => $year,
                        ])->first();
                        $points = $entry ? $entry->points : 0;
                    }

                    $total += $points;
                    $breakdown[] = [
                        "parameter_id" => $param->id,
                        "parameter" => $param->name,
                        "input_type" => $param->input_type,
                        "points" => round($points, 2),
                        "is_auto" => $param->input_type === "auto",
                    ];
                }

                return [
                    "user_id" => $userId,
                    "name" => $member->user->name,
                    "role" => $member->role,
                    "scheme" => $scheme,
                    "total" => round($total, 2),
                    "breakdown" => $breakdown,
                ];
            })
            ->sortByDesc("total")
            ->values();
    }

    private function schemeFor(string $role): string
    {
        return $role === "tutor" ? "tutor" : "management";
    }

    private function calcAuto(
        LeaderboardParameter $param,
        int $userId,
        int $teamId,
        string $quarter,
        int $year,
    ): float {
        $config = $param->config ?? [];
        $source = $config["source"] ?? "";

        [$from, $to] = $this->quarterDateRange($quarter, $year);

        $pct = match ($source) {
            "rocks" => $this->rocksRate($userId, $teamId, $from, $to),
            "scorecard" => $this->scorecardRate($userId, $teamId, $from, $to),
            "events" => $this->eventsRate($userId, $teamId, $from, $to),
            "leadership" => $this->leadershipRate($userId, $teamId),
            default => 0,
        };

        // auto param bisa pakai tiered atau normalized
        if (!empty($config["tiers"])) {
            return $param->calculatePoints($pct); // reuse tiered logic via pct value
        }

        $max = (float) ($config["max_points"] ?? 0);
        return round(($pct / 100) * $max, 2);
    }

    private function quarterDateRange(string $quarter, int $year): array
    {
        return match ($quarter) {
            "Q1" => ["{$year}-01-01", "{$year}-03-31"],
            "Q2" => ["{$year}-04-01", "{$year}-06-30"],
            "Q3" => ["{$year}-07-01", "{$year}-09-30"],
            "Q4" => ["{$year}-10-01", "{$year}-12-31"],
            default => ["{$year}-01-01", "{$year}-12-31"],
        };
    }

    private function rocksRate(
        int $userId,
        int $teamId,
        string $from,
        string $to,
    ): float {
        $q = Rock::withoutGlobalScopes()
            ->where("team_id", $teamId)
            ->where("owner_id", $userId)
            ->whereBetween("created_at", [$from, $to]);
        $total = (clone $q)->count();
        if (!$total) {
            return 0;
        }
        return round(
            ((clone $q)->where("status", "done")->count() / $total) * 100,
            2,
        );
    }

    private function scorecardRate(
        int $userId,
        int $teamId,
        string $from,
        string $to,
    ): float {
        $metrics = Metric::withoutGlobalScopes()
            ->where("team_id", $teamId)
            ->where("owner_id", $userId)
            ->with([
                "scores" => fn($q) => $q->whereBetween("week_start_date", [
                    $from,
                    $to,
                ]),
            ])
            ->get();
        $total = $metrics->sum(fn($m) => $m->scores->count());
        if (!$total) {
            return 0;
        }
        $green = $metrics->sum(
            fn($m) => $m->scores->where("status", "green")->count(),
        );
        return round(($green / $total) * 100, 2);
    }

    private function eventsRate(
        int $userId,
        int $teamId,
        string $from,
        string $to,
    ): float {
        $total = Event::withoutGlobalScopes()
            ->where("team_id", $teamId)
            ->whereBetween("event_date", [$from, $to])
            ->count();
        if (!$total) {
            return 0;
        }
        $attended = EventAttendance::withoutGlobalScopes()
            ->whereHas(
                "event",
                fn($q) => $q
                    ->withoutGlobalScopes()
                    ->where("team_id", $teamId)
                    ->whereBetween("event_date", [$from, $to]),
            )
            ->where("user_id", $userId)
            ->where("attended", true)
            ->count();
        return round(($attended / $total) * 100, 2);
    }

    private function leadershipRate(int $userId, int $teamId): float
    {
        $cycle = AssessmentCycle::withoutGlobalScopes()
            ->where("team_id", $teamId)
            ->where("status", "closed")
            ->latest()
            ->first();
        if (!$cycle) {
            return 0;
        }
        $avg = AssessmentResponse::where("cycle_id", $cycle->id)
            ->where("assessee_id", $userId)
            ->avg("rubric_level");
        if (!$avg) {
            return 0;
        }
        // rubric 1-5 → persentase 0-100
        return round((($avg - 1) / 4) * 100, 2);
    }
}
