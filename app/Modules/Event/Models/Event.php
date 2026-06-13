<?php

namespace App\Modules\Event\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Event extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'name',
        'type',
        'event_date',
        'description',
        'assigned_roles',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'event_date'     => 'date',
        'assigned_roles' => 'array',
    ];

    public function attendances()
    {
        return $this->hasMany(EventAttendance::class);
    }

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_attendances')
                    ->withPivot('attended', 'marked_at', 'marked_by')
                    ->withTimestamps();
    }
}
