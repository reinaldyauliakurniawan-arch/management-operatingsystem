<?php

namespace App\Modules\Rocks\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;

class RockQuarterTarget extends Model
{
    use HasTeam;

    protected $casts = [
        'quarter_date' => 'date',
    ];

    protected $fillable = [
        'team_id',
        'quarter',
        'year',
        'quarter_date',
        'quarter_revenue',
        'quarter_profit',
        'quarter_measurables',
        'created_by',
        'updated_by',
    ];
}
