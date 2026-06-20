<?php

namespace App\Modules\LeadershipAssessment\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;

class LeadershipItem extends Model
{
    use HasOrganization;

    // ponytail: added HasOrganization trait. organization_id is denormalized
    // from the parent leadership_type — set explicitly in the controller when
    // creating items so we can scope queries by org without joining.
    protected $fillable = ['leadership_type_id', 'title', 'organization_id'];

    public function leadershipType()
    {
        return $this->belongsTo(LeadershipType::class);
    }

    public function rubrics()
    {
        return $this->hasMany(LeadershipRubric::class)->orderBy('level');
    }
}
