<?php

namespace App\Modules\Scorecard\Actions;

use App\Modules\Scorecard\Models\WeeklyScore;

class LogWeeklyScore
{
    public function execute(array $data): WeeklyScore
    {
        return WeeklyScore::updateOrCreate(
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
    }
}
