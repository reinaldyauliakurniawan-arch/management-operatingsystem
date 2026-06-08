<?php

namespace App\Modules\Scorecard\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Metric extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'title',
        'owner_id',
        'goal_value',
        'comparison_operator',
        'created_by',
        'updated_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function scores()
    {
        return $this->hasMany(WeeklyScore::class);
    }
}
