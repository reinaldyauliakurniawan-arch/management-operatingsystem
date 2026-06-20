<?php

namespace App\Modules\LeadershipAssessment\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;

class LeadershipRubric extends Model
{
    use HasOrganization;

    // ponytail: added HasOrganization trait. organization_id denormalized from
    // parent leadership_item for the same reason as LeadershipItem.
    protected $fillable = ['leadership_item_id', 'level', 'description', 'organization_id'];
}
