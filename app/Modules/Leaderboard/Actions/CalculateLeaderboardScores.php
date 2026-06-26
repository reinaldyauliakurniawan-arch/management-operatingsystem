<?php

namespace App\Modules\Leaderboard\Actions;

use App\Modules\Teams\Models\TeamMember;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Models\WeeklyScore;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventAttendance;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use Illuminate\Support\Collection;

class CalculateLeaderboardScores
{
    /**
     * ponytail: rewritten to eliminate the N×M query pattern.
     *
     * Old version: for each member × each parameter, run a separate query
     * to look up LeaderboardEntry. A 20-member team with 10 parameters =
     * 200+ queries per page load (dashboard calls this twice).
     *
     * New version: 1 query to fetch all relevant entries for the (team,
     * quarter, year) tuple, indexed by (user_id, parameter_id) in PHP.
     * Same data, 1 query instead of N×M.
     *
     * Auto parameters still need per-source queries (rocks/scorecard/etc),
     * but those are batched per source per user viawhereIn — no longer
     * per-(user,param) row.
     */
    public function executeAcrossTeams(
        array $teamIds,
        string $quarter,
        int $year,
        string $scheme, // "tutor" | "management"
    ): Collection {
        $allMembers = TeamMember::with(['user', 'team'])
            ->whereIn('team_id', $teamIds)
            ->get()
            ->unique('user_id');

        $filtered = $allMembers->filter(fn($m) => $this->schemeFor($m->role) === $scheme)
            ->values();

        $params = LeaderboardParameter::whereIn('team_id', $teamIds)
            ->where('scheme', $scheme)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $userIdToTeamId = $filtered->pluck('team_id', 'user_id');
        $userIds = $filtered->pluck('user_id')->all();

        // ponytail: 1 query for all entries across all users × all params.
        $entriesByUserParam = $this->loadEntriesIndex(
            $teamIds, $userIds, $params->pluck('id')->all(), $quarter, $year,
        );

        // ponytail: precompute auto-source rates once per user, keyed by source.
        $autoSources = $params->where('input_type', 'auto')
            ->pluck('config')
            ->map(fn($c) => is_array($c) ? ($c['source'] ?? null) : null)
            ->filter()
            ->unique()
            ->values();
        $autoRatesByUser = $this->loadAutoRates($autoSources, $userIds, $teamIds, $quarter, $year);

        return $filtered->map(function ($member) use ($params, $entriesByUserParam, $autoRatesByUser, $scheme) {
            $userId = $member->user_id;
            $breakdown = [];
            $total = 0;

            foreach ($params as $param) {
                $points = $param->input_type === 'auto'
                    ? $this->lookupAutoPoints($param, $userId, $autoRatesByUser)
                    : ($entriesByUserParam[$userId][$param->id] ?? 0);

                $total += $points;
                $breakdown[] = [
                    'parameter_id' => $param->id,
                    'parameter'    => $param->name,
                    'input_type'   => $param->input_type,
                    'points'       => round($points, 2),
                    'is_auto'      => $param->input_type === 'auto',
                ];
            }

            return [
                'user_id'   => $userId,
                'name'      => $member->user->name,
                'role'      => $member->role,
                'team_name' => $member->team->name ?? null,
                'scheme'    => $scheme,
                'total'     => round($total, 2),
                'breakdown' => $breakdown,
            ];
        })
        ->sortByDesc('total')
        ->values();
    }

    public function execute(int $teamId, string $quarter, int $year): Collection
    {
        $members = TeamMember::with('user')->where('team_id', $teamId)->get();

        $userIds = $members->pluck('user_id')->all();

        // ponytail: org-wide lookup — parameter dan entries keduanya disimpan
        // dengan team_id = team pemilik parameter (bukan team member).
        // Query by selectedTeamId saja menyebabkan mismatch scheme dan entries nol.
        $orgTeamIds = \App\Modules\Teams\Models\Team::withoutGlobalScopes()
            ->where('organization_id', function ($q) use ($teamId) {
                $q->select('organization_id')->from('teams')->where('id', $teamId);
            })
            ->pluck('id')
            ->all();

        $params = LeaderboardParameter::whereIn('team_id', $orgTeamIds)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $entriesByUserParam = $this->loadEntriesIndex(
            $orgTeamIds, $userIds, $params->pluck('id')->all(), $quarter, $year,
        );

        $autoSources = $params->where('input_type', 'auto')
            ->pluck('config')
            ->map(fn($c) => is_array($c) ? ($c['source'] ?? null) : null)
            ->filter()
            ->unique()
            ->values();
        $autoRatesByUser = $this->loadAutoRates($autoSources, $userIds, [$teamId], $quarter, $year);

        return $members->map(function ($member) use ($params, $entriesByUserParam, $autoRatesByUser, $teamId) {
            $userId = $member->user_id;
            $scheme = $this->schemeFor($member->role);
            $breakdown = [];
            $total = 0;

            foreach ($params->where('scheme', $scheme) as $param) {
                $points = $param->input_type === 'auto'
                    ? $this->lookupAutoPoints($param, $userId, $autoRatesByUser)
                    : ($entriesByUserParam[$userId][$param->id] ?? 0);

                $total += $points;
                $breakdown[] = [
                    'parameter_id' => $param->id,
                    'parameter'    => $param->name,
                    'input_type'   => $param->input_type,
                    'points'       => round($points, 2),
                    'is_auto'      => $param->input_type === 'auto',
                ];
            }

            return [
                'user_id'   => $userId,
                'name'      => $member->user->name,
                'role'      => $member->role,
                'scheme'    => $scheme,
                'total'     => round($total, 2),
                'breakdown' => $breakdown,
            ];
        })
        ->sortByDesc('total')
        ->values();
    }

    /**
     * ponytail: 1 query for all leaderboard entries matching the given
     * (teams, users, params, quarter, year) tuple. Returns nested map:
     *   [user_id => [parameter_id => points]]
     */
    private function loadEntriesIndex(array $teamIds, array $userIds, array $paramIds, string $quarter, int $year): array
    {
        if (empty($userIds) || empty($paramIds)) {
            return [];
        }

        $entries = LeaderboardEntry::whereIn('team_id', $teamIds)
            ->whereIn('user_id', $userIds)
            ->whereIn('parameter_id', $paramIds)
            ->where('quarter', $quarter)
            ->where('year', $year)
            ->get(['user_id', 'parameter_id', 'points']);

        $index = [];
        foreach ($entries as $e) {
            $index[$e->user_id][$e->parameter_id] = $e->points;
        }
        return $index;
    }

    /**
     * ponytail: precompute auto-source rates once per user, instead of
     * running rocks/scorecard/events/leadership queries per (user, param).
     *
     * Returns: [source => [user_id => rate]]
     */
    private function loadAutoRates(Collection $sources, array $userIds, array $teamIds, string $quarter, int $year): array
    {
        if (empty($userIds) || $sources->isEmpty()) {
            return [];
        }

        [$from, $to] = $this->quarterDateRange($quarter, $year);
        $out = [];

        if ($sources->contains('rocks')) {
            $out['rocks'] = $this->batchRocksRates($userIds, $teamIds, $from, $to);
        }
        if ($sources->contains('scorecard')) {
            $out['scorecard'] = $this->batchScorecardRates($userIds, $teamIds, $from, $to);
        }
        if ($sources->contains('events')) {
            $out['events'] = $this->batchEventsRates($userIds, $teamIds, $from, $to);
        }
        if ($sources->contains('leadership')) {
            $out['leadership'] = $this->batchLeadershipRates($userIds, $teamIds);
        }
        return $out;
    }

    /**
     * ponytail: lookup the auto-computed rate for a (param, user) from the
     * precomputed map, then convert to points using the param config.
     */
    private function lookupAutoPoints(LeaderboardParameter $param, int $userId, array $autoRatesByUser): float
    {
        $config = is_array($param->config) ? $param->config : [];
        $source = $config['source'] ?? '';
        $pct = $autoRatesByUser[$source][$userId] ?? 0;

        if (!empty($config['tiers'])) {
            return $param->calculatePoints($pct);
        }
        $max = (float) ($config['max_points'] ?? 0);
        return round(($pct / 100) * $max, 2);
    }

    private function schemeFor(string $role): string
    {
        return $role === 'tutor' ? 'tutor' : 'management';
    }

    private function quarterDateRange(string $quarter, int $year): array
    {
        return match ($quarter) {
            'Q1' => ["{$year}-01-01", "{$year}-03-31"],
            'Q2' => ["{$year}-04-01", "{$year}-06-30"],
            'Q3' => ["{$year}-07-01", "{$year}-09-30"],
            'Q4' => ["{$year}-10-01", "{$year}-12-31"],
            default => ["{$year}-01-01", "{$year}-12-31"],
        };
    }

    /**
     * ponytail: batch version — 2 queries (totals + done) for all users at once.
     */
    private function batchRocksRates(array $userIds, array $teamIds, string $from, string $to): array
    {
        $base = Rock::withoutGlobalScopes()
            ->whereIn('team_id', $teamIds)
            ->whereIn('owner_id', $userIds)
            ->whereBetween('created_at', [$from, $to]);

        $totals = (clone $base)->selectRaw('owner_id, COUNT(*) as cnt')
            ->groupBy('owner_id')->pluck('cnt', 'owner_id');

        $dones = (clone $base)->where('status', 'done')
            ->selectRaw('owner_id, COUNT(*) as cnt')
            ->groupBy('owner_id')->pluck('cnt', 'owner_id');

        $out = [];
        foreach ($userIds as $uid) {
            $total = $totals[$uid] ?? 0;
            $out[$uid] = $total ? round((($dones[$uid] ?? 0) / $total) * 100, 2) : 0;
        }
        return $out;
    }

    /**
     * ponytail: batch — pull all metrics + their scores for the user set,
     * compute green ratio per user in PHP.
     */
    private function batchScorecardRates(array $userIds, array $teamIds, string $from, string $to): array
    {
        $metrics = Metric::withoutGlobalScopes()
            ->whereIn('team_id', $teamIds)
            ->whereIn('owner_id', $userIds)
            ->with(['scores' => fn($q) => $q->whereBetween('week_start_date', [$from, $to])])
            ->get(['id', 'owner_id']);

        $totals = [];
        $greens = [];
        foreach ($metrics as $m) {
            $uid = $m->owner_id;
            $totals[$uid] = ($totals[$uid] ?? 0) + $m->scores->count();
            $greens[$uid] = ($greens[$uid] ?? 0) + $m->scores->where('status', 'green')->count();
        }
        $out = [];
        foreach ($userIds as $uid) {
            $total = $totals[$uid] ?? 0;
            $out[$uid] = $total ? round(($greens[$uid] ?? 0) / $total * 100, 2) : 0;
        }
        return $out;
    }

    /**
     * ponytail: batch — total events per team + attended per user.
     */
    private function batchEventsRates(array $userIds, array $teamIds, string $from, string $to): array
    {
        $eventsPerTeam = Event::withoutGlobalScopes()
            ->whereIn('team_id', $teamIds)
            ->whereBetween('event_date', [$from, $to])
            ->selectRaw('team_id, COUNT(*) as cnt')
            ->groupBy('team_id')
            ->pluck('cnt', 'team_id');

        // User → primary team mapping (use first team membership found).
        $userTeams = TeamMember::withoutGlobalScopes()
            ->whereIn('team_id', $teamIds)
            ->whereIn('user_id', $userIds)
            ->get(['user_id', 'team_id'])
            ->groupBy('user_id')
            ->map(fn($g) => $g->first()->team_id);

        $attended = EventAttendance::withoutGlobalScopes()
            ->whereHas('event', fn($q) => $q->withoutGlobalScopes()->whereIn('team_id', $teamIds)->whereBetween('event_date', [$from, $to]))
            ->whereIn('user_id', $userIds)
            ->where('attended', true)
            ->selectRaw('user_id, COUNT(*) as cnt')
            ->groupBy('user_id')
            ->pluck('cnt', 'user_id');

        $out = [];
        foreach ($userIds as $uid) {
            $teamId = $userTeams[$uid] ?? null;
            $total = $teamId ? ($eventsPerTeam[$teamId] ?? 0) : 0;
            $out[$uid] = $total ? round((($attended[$uid] ?? 0) / $total) * 100, 2) : 0;
        }
        return $out;
    }

    /**
     * ponytail: batch — latest closed cycle per team, then avg per assessee.
     */
    private function batchLeadershipRates(array $userIds, array $teamIds): array
    {
        $cycles = AssessmentCycle::withoutGlobalScopes()
            ->whereIn('team_id', $teamIds)
            ->where('status', 'closed')
            ->get(['id', 'team_id'])
            ->groupBy('team_id')
            ->map(fn($g) => $g->sortByDesc('id')->first()?->id);

        $cycleIds = $cycles->filter()->values()->all();
        if (empty($cycleIds)) {
            return array_fill_keys($userIds, 0);
        }

        $avgs = AssessmentResponse::whereIn('cycle_id', $cycleIds)
            ->whereIn('assessee_id', $userIds)
            ->selectRaw('assessee_id, AVG(rubric_level) as avg_level')
            ->groupBy('assessee_id')
            ->pluck('avg_level', 'assessee_id');

        $out = [];
        foreach ($userIds as $uid) {
            $avg = $avgs[$uid] ?? null;
            $out[$uid] = $avg ? round((($avg - 1) / 4) * 100, 2) : 0;
        }
        return $out;
    }
}
