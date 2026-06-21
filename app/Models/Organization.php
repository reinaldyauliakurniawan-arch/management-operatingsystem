<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Teams\Models\Team;

class Organization extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'slug', 'parent_org_id', 'created_by', 'updated_by'];

    public function users()
    {
        // Users are now linked via teams
        return $this->hasManyThrough(User::class, Team::class);
    }

    /**
     * ponytail: direct membership pivot (org_user). Use this for admin
     * checks and "who belongs to this org" queries — faster than the
     * hasManyThrough via teams.
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    public function admins()
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->wherePivot('is_admin', true)
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    public function parent()
    {
        return $this->belongsTo(Organization::class, 'parent_org_id');
    }

    public function children()
    {
        return $this->hasMany(Organization::class, 'parent_org_id');
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }
}
