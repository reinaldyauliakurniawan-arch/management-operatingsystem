<?php

namespace App\Modules\Scorecard\Actions;

use App\Modules\IDS\Models\Issue;
use App\Modules\Scorecard\Models\WeeklyScore;

class LogWeeklyScore
{
    public function execute(array $data): WeeklyScore
    {
        $score = WeeklyScore::updateOrCreate(
            [
                'metric_id'       => $data['metric_id'],
                'week_start_date' => $data['week_start_date'],
            ],
            [
                'actual_value' => $data['actual_value'],
                'created_by'   => $data['created_by'] ?? auth()->id(),
                'updated_by'   => auth()->id(),
            ]
        );

        $score->load('metric');
        $this->createIssueIfRepeatedRed($score);

        return $score;
    }

    private function createIssueIfRepeatedRed(WeeklyScore $score): void
    {
        if ($score->status !== 'red') {
            return;
        }

        $recentScores = WeeklyScore::where('metric_id', $score->metric_id)
            ->with('metric')
            ->orderByDesc('week_start_date')
            ->limit(2)
            ->get();

        if ($recentScores->count() < 2) {
            return;
        }

        if (! $recentScores->every(fn (WeeklyScore $s) => $s->status === 'red')) {
            return;
        }

        $metric = $score->metric;
        $title  = "Scorecard merah berulang: {$metric->title}";

        $exists = Issue::withoutGlobalScopes()
            ->where('team_id', $metric->team_id)
            ->where('title', $title)
            ->where('status', 'open')
            ->exists();

        if ($exists) {
            return;
        }

        Issue::create([
            'team_id'     => $metric->team_id,
            'title'       => $title,
            'description' => 'Metrik ini berstatus merah 2 minggu berturut-turut.',
            'priority'    => 5,
            'status'      => 'open',
            'owner_id'    => $metric->owner_id,
            'created_by'  => auth()->id(),
        ]);
    }
}
