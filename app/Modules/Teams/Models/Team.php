<?php

namespace App\Modules\Teams\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasOrganization;
use App\Models\Organization;
use App\Models\User;

class Team extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'team_id',
        'name',
        'type',
        'parent_team_id',
        'created_by',
        'updated_by',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function parent()
    {
        return $this->belongsTo(Team::class, 'parent_team_id');
    }

    public function children()
    {
        return $this->hasMany(Team::class, 'parent_team_id');
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'team_members');
    }
}
