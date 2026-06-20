<?php

namespace App\Modules\Organization\Actions;

use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateOrganization
{
    public function execute(array $data): Organization
    {
        // ponytail: wrap org + team + membership + is_org_admin flag in one
        // transaction. If any step fails (e.g. unique slug collision), the
        // partial org/team rows roll back instead of orphaning.
        return DB::transaction(function () use ($data) {
            $organization = Organization::create([
                'name'       => $data['name'],
                'slug'       => Str::slug($data['name']) . '-' . Str::random(6),
                'created_by' => Auth::id(),
            ]);

            $team = Team::create([
                'organization_id' => $organization->id,
                'name'            => 'Leadership Team',
                'type'            => 'leadership',
                'created_by'      => Auth::id(),
            ]);

            TeamMember::create([
                'team_id'       => $team->id,
                'user_id'       => Auth::id(),
                'role'          => 'leader',
                'is_integrator' => true,
            ]);

            // ponytail: creator becomes admin of THIS org via the pivot
            // (was global is_org_admin=true — closed C2 cross-tenant escalation).
            Auth::user()->promoteToOrgAdmin($organization->id);

            session([
                'active_team_id'         => $team->id,
                'active_organization_id' => $organization->id,
            ]);

            return $organization;
        });
    }
}
