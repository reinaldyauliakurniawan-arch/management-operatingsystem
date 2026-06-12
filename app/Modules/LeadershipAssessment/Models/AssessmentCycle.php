<?php

namespace App\Modules\LeadershipAssessment\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class AssessmentCycle extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'name',
        'status',
        'periode_start',
        'periode_end',
        'created_by',
    ];

    protected $casts = [
        'periode_start' => 'date',
        'periode_end'   => 'date',
    ];

    public function assignments()
    {
        return $this->hasMany(AssessmentAssignment::class, 'cycle_id');
    }

    public function responses()
    {
        return $this->hasMany(AssessmentResponse::class, 'cycle_id');
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function canBeDeleted(): bool
    {
        return $this->responses()->count() === 0;
    }
}
