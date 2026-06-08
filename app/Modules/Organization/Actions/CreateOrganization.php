<?php

namespace App\Modules\Organization\Actions;

use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CreateOrganization
{
    public function execute(array $data): Organization
    {
        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'created_by' => Auth::id(),
        ]);

        // Create initial leadership team
        $team = Team::create([
            'organization_id' => $organization->id,
            'name' => 'Leadership Team',
            'type' => 'leadership',
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => Auth::id(),
            'role' => 'leader',
            'is_integrator' => true,
        ]);

        session([
            'active_team_id' => $team->id,
            'active_organization_id' => $organization->id,
        ]);

        return $organization;
    }
}
