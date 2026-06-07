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
}
