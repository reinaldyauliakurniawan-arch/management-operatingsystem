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
        'title',
        'scheduled_at',
        'started_at',
        'ended_at',
        'rating',
        'segue_notes',
        'conclude_notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at'   => 'datetime',
        'ended_at'     => 'datetime',
    ];

    public function todos()
    {
        return $this->hasMany(\App\Modules\ToDo\Models\ToDo::class, 'meeting_id');
    }

    public function isOngoing(): bool
    {
        return $this->started_at !== null && $this->ended_at === null;
    }

    public function isScheduled(): bool
    {
        return $this->started_at === null && $this->scheduled_at !== null;
    }

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'meeting_attendees');
    }
}
