<?php

namespace App\Modules\LeadershipAssessment\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class AssessmentAssignment extends Model
{
    protected $fillable = [
        'cycle_id',
        'user_id',
        'leadership_type_id',
    ];

    public function cycle()
    {
        return $this->belongsTo(AssessmentCycle::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function leadershipType()
    {
        return $this->belongsTo(LeadershipType::class);
    }

    public function responses()
    {
        return $this->hasMany(AssessmentResponse::class, 'assessee_id', 'user_id')
            ->where('cycle_id', $this->cycle_id ?? 0);
    }

    public function additionalAssessors()
    {
        return $this->hasMany(AdditionalAssessor::class, 'assignment_id');
    }
}
