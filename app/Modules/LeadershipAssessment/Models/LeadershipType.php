<?php

namespace App\Modules\LeadershipAssessment\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;

class LeadershipType extends Model
{
    use HasOrganization;

    // ponytail: added HasOrganization trait + organization_id to fillable.
    // Previously this model was global (no org scope), which meant every
    // organization shared the same rubrik library — Org A editing a rubric
    // changed it for Org B. Now each org owns its own rubrik library.
    protected $fillable = ['name', 'organization_id'];

    public function items()
    {
        return $this->hasMany(LeadershipItem::class);
    }
}
