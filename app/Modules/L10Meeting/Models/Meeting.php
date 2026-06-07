<?php

namespace App\Modules\L10Meeting\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Meeting extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'organization_id',
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
