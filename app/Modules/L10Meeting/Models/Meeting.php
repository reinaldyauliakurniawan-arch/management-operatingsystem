<?php

namespace App\Modules\L10Meeting\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Meeting extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'type',
        'started_at',
        'ended_at',
        'rating',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'meeting_attendees');
    }
}
