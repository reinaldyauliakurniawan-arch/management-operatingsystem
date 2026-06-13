<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\VTO\Models\VTOPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VTOTest extends TestCase
{
    use RefreshDatabase;

    private function setupLeaderWithTeam(): array
    {
        $user = User::factory()->create();
        $organization = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        $team = Team::create([
            'organization_id' => $organization->id,
            'name' => 'Test Team',
            'type' => 'leadership',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => 'leader',
        ]);

        return [$user, $team, $organization];
    }

    public function test_vto_index_page_is_accessible(): void
    {
        [$user, $team, $organization] = $this->setupLeaderWithTeam();

        $response = $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $organization->id,
            ])
            ->get('/vto');

        $response->assertStatus(200);
        $this->assertDatabaseHas('vto_plans', [
            'organization_id' => $organization->id,
        ]);
    }

    public function test_vto_can_be_updated(): void
    {
        [$user, $team, $organization] = $this->setupLeaderWithTeam();

        VTOPlan::withoutGlobalScopes()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $organization->id,
            ])
            ->post('/vto', [
                'ten_year_target' => 'To be the best',
                'core_focus_purpose' => 'Helping people',
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('vto_plans', [
            'organization_id' => $organization->id,
            'ten_year_target' => 'To be the best',
            'core_focus_purpose' => 'Helping people',
        ]);
    }

    public function test_vto_is_shared_across_teams_in_same_organization(): void
    {
        [$user, $team, $organization] = $this->setupLeaderWithTeam();

        $team2 = Team::create([
            'organization_id' => $organization->id,
            'name' => 'Second Team',
            'type' => 'departmental',
        ]);
        TeamMember::create([
            'team_id' => $team2->id,
            'user_id' => $user->id,
            'role' => 'leader',
        ]);

        VTOPlan::withoutGlobalScopes()->create([
            'organization_id' => $organization->id,
            'ten_year_target' => 'Shared vision',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team2->id,
                'active_organization_id' => $organization->id,
            ])
            ->get('/vto')
            ->assertStatus(200);

        $this->assertEquals(1, VTOPlan::withoutGlobalScopes()->where('organization_id', $organization->id)->count());
    }
}
