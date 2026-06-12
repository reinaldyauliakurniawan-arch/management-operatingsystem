<?php

namespace App\Modules\Scorecard\Models;

use Illuminate\Database\Eloquent\Model;

class WeeklyScore extends Model
{
    protected $fillable = [
        'metric_id',
        'week_start_date',
        'actual_value',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'week_start_date' => 'date',
    ];

    public function metric()
    {
        return $this->belongsTo(Metric::class);
    }

    /**
     * Compute status based on actual_value vs metric goal.
     * green = meets goal, yellow = within 10% miss, red = miss >10%
     */
    public function getStatusAttribute(): string
    {
        $metric = $this->relationLoaded('metric') ? $this->metric : $this->metric()->first();
        if (!$metric) return 'red';

        $goal   = (float) $metric->goal_value;
        $actual = (float) $this->actual_value;
        $op     = $metric->comparison_operator;

        $meets = match ($op) {
            '>='  => $actual >= $goal,
            '<='  => $actual <= $goal,
            '=='  => abs($actual - $goal) < 0.001,
            default => false,
        };

        if ($meets) return 'green';

        // Yellow: within 10% of goal
        if ($goal != 0) {
            $pctOff = abs($actual - $goal) / abs($goal);
            if ($pctOff <= 0.10) return 'yellow';
        }

        return 'red';
    }
}
