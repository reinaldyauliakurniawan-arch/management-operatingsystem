<?php

namespace App\Modules\Leaderboard\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class LeaderboardEntry extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'parameter_id',
        'user_id',
        'points',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'points' => 'float',
    ];

    public function parameter()
    {
        return $this->belongsTo(LeaderboardParameter::class, 'parameter_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
