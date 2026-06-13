<?php

namespace App\Modules\VTO\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VTOPlan extends Model
{
    use SoftDeletes, HasOrganization;

    protected $table = 'vto_plans';

    protected $fillable = [
        'organization_id',
        'core_values',
        'core_focus_purpose',
        'core_focus_niche',
        'ten_year_target',
        'target_market',
        'three_uniques',
        'proven_process',
        'guarantee',
        'three_year_date',
        'three_year_revenue',
        'three_year_profit',
        'three_year_measurables',
        'three_year_look',
        'one_year_date',
        'one_year_revenue',
        'one_year_profit',
        'one_year_measurables',
        'one_year_goals',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'core_values' => 'array',
        'three_year_look' => 'array',
        'one_year_goals' => 'array',
        'three_year_date' => 'date',
        'one_year_date' => 'date',
    ];
}
