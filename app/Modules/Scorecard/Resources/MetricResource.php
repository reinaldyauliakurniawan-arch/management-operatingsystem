<?php

namespace App\Modules\Scorecard\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MetricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'owner' => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ],
            'goal_value' => $this->goal_value,
            'comparison_operator' => $this->comparison_operator,
            'scores' => $this->scores->map(fn($s) => [
                'week_start_date' => $s->week_start_date->format('Y-m-d'),
                'actual_value' => $s->actual_value,
                'status' => $this->calculateStatus($s->actual_value),
            ]),
        ];
    }

    private function calculateStatus($actual): string
    {
        $goal = (float) $this->goal_value;
        $actual = (float) $actual;
        $op   = $this->comparison_operator;

        $meets = match ($op) {
            '>='    => $actual >= $goal,
            '<='    => $actual <= $goal,
            '=='    => abs($actual - $goal) < 0.001,
            default => false,
        };

        if ($meets) return 'green';

        if ($goal != 0) {
            $pctOff = abs($actual - $goal) / abs($goal);
            if ($pctOff <= 0.10) return 'yellow';
        }

        return 'red';
    }
}
