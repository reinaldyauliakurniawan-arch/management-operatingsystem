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
        'custom_type',
        'event_date',
        'description',
        'agenda',
        'assigned_roles',
        'is_generated',
        'is_modified',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'event_date'     => 'date',
        'assigned_roles' => 'array',
        'agenda'         => 'array',
        'is_generated'   => 'boolean',
        'is_modified'    => 'boolean',
    ];

    public function team()
    {
        return $this->belongsTo(\App\Modules\Teams\Models\Team::class);
    }

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

    /**
     * Label tipe yang ditampilkan ke user.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'training'  => 'Training',
            'townhall'  => 'Townhall',
            'l10'       => 'L10 Meeting',
            'quarterly' => 'Quarterly Meeting',
            'annual'    => 'Annual Meeting',
            'custom'    => $this->custom_type ?? 'Custom',
            default     => ucfirst($this->type),
        };
    }
}
