<?php

namespace App\Modules\LeadershipAssessment\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class AdditionalAssessor extends Model
{
    protected $fillable = [
        'assignment_id',
        'user_id',
    ];

    public function assignment()
    {
        return $this->belongsTo(AssessmentAssignment::class, 'assignment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
