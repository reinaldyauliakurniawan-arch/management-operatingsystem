<?php

namespace App\Modules\LeadershipAssessment\Models;

use Illuminate\Database\Eloquent\Model;

class LeadershipItem extends Model
{
    protected $fillable = ['leadership_type_id', 'title'];

    public function leadershipType()
    {
        return $this->belongsTo(LeadershipType::class);
    }

    public function rubrics()
    {
        return $this->hasMany(LeadershipRubric::class)->orderBy('level');
    }
}
