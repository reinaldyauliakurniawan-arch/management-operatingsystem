<?php

namespace App\Modules\Teams\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class TeamMember extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'team_id',
        'user_id',
        'role',
        'is_integrator',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
