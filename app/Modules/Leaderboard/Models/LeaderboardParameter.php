<?php

namespace App\Modules\Leaderboard\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaderboardParameter extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'name',
        'max_points',
        'assigned_roles',
        'is_automatic',
        'automatic_source',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'assigned_roles' => 'array',
        'is_automatic'   => 'boolean',
        'max_points'     => 'float',
    ];

    public function entries()
    {
        return $this->hasMany(LeaderboardEntry::class, 'parameter_id');
    }
}
