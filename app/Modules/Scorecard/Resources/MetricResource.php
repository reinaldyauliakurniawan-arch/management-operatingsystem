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

    private function calculateStatus($actual)
    {
        $goal = $this->goal_value;
        return match ($this->comparison_operator) {
            '>=' => $actual >= $goal ? 'green' : 'red',
            '<=' => $actual <= $goal ? 'green' : 'red',
            '==' => $actual == $goal ? 'green' : 'red',
            default => 'red',
        };
    }
}
