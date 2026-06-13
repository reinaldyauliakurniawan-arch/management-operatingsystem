<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class EventAttendance extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'attended',
        'marked_at',
        'marked_by',
    ];

    protected $casts = [
        'attended'  => 'boolean',
        'marked_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
