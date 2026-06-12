<?php

namespace App\Modules\PeopleAnalyzer\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Evaluation extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'evaluatee_id',
        'evaluator_id',
        'core_value_ratings',
        'gets_it',
        'wants_it',
        'capacity',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'core_value_ratings' => 'array',
        'gets_it'  => 'string',
        'wants_it' => 'string',
        'capacity' => 'string',
    ];

    public function evaluatee()
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }
}
