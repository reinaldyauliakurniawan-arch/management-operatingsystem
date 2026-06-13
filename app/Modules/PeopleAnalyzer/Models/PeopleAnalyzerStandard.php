<?php

namespace App\Modules\PeopleAnalyzer\Models;

use Illuminate\Database\Eloquent\Model;

class PeopleAnalyzerStandard extends Model
{
    protected $table = 'people_analyzer_standards';

    protected $fillable = [
        'team_id',
        'min_plus',
        'max_plus_minus',
        'max_minus',
        'gwc_get',
        'gwc_want',
        'gwc_capacity',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gwc_get'  => 'boolean',
        'gwc_want' => 'boolean',
    ];
}
