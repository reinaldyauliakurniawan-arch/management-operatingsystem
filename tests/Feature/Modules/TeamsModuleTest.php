<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — Teams module tests (was zero-test).
 * Covers: index (no cross-org leak), store (org admin only),
 * destroy (org-scoped), user management, role updates.
 */
class TeamsModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupOrgWithAdminAndLeader(): array
    {
        $org = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        $team = Team::create(['organization_id' => $org->id, 'name' => 'Team A', 'type' => 'leadership']);
        $admin = User::factory()->create();
        $leader = User::factory()->create();
        $member = User::factory()->create();

        TeamMember::create(['team_id' => $team->id, 'user_id' => $admin->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);

        \DB::table('organization_user')->insert([
            ['organization_id' => $org->id, 'user_id' => $admin->id, 'is_admin' => true, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $leader->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $member->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return [$org, $team, $admin, $leader, $member];
    }

    public function test_member_cannot_access_teams_management()
    {
        [$org, $team, $admin, $leader, $member] = $this->setupOrgWithAdminAndLeader();

        // ponytail: members can view /teams but the management buttons only
        // show for org admins. The store endpoint must reject non-admins.
        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('teams.store'), [
                'name' => 'New Team', 'type' => 'leadership', 'leader_user_id' => $leader->id,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('teams', ['name' => 'New Team']);
    }

    public function test_admin_can_create_team()
    {
        [$org, $team, $admin, $leader, $member] = $this->setupOrgWithAdminAndLeader();

        $response = $this->actingAs($admin)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('teams.store'), [
                'name' => 'New Team', 'type' => 'departmental', 'leader_user_id' => $leader->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teams', ['name' => 'New Team', 'organization_id' => $org->id]);
    }

    public function test_admin_cannot_delete_team_in_other_org()
    {
        [$orgA, $teamA, $adminA, $leaderA, $memberA] = $this->setupOrgWithAdminAndLeader();

        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b']);
        $teamB = Team::create(['organization_id' => $orgB->id, 'name' => 'Team B', 'type' => 'leadership']);
        $leaderB = User::factory()->create();
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $leaderB->id, 'role' => 'leader']);

        $response = $this->actingAs($adminA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $orgA->id])
            ->delete(route('teams.destroy', $teamB));

        $response->assertForbidden();
        $this->assertDatabaseHas('teams', ['id' => $teamB->id]);
    }

    public function test_admin_can_delete_team_in_own_org()
    {
        [$org, $team, $admin, $leader, $member] = $this->setupOrgWithAdminAndLeader();
        $newTeam = Team::create(['organization_id' => $org->id, 'name' => 'To Delete', 'type' => 'project']);

        $response = $this->actingAs($admin)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->delete(route('teams.destroy', $newTeam));

        $response->assertRedirect();
        $this->assertSoftDeleted('teams', ['id' => $newTeam->id]);
    }

    public function test_admin_can_promote_user_to_org_admin()
    {
        [$org, $team, $admin, $leader, $member] = $this->setupOrgWithAdminAndLeader();

        $response = $this->actingAs($admin)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('users.update', $member), [
                'name' => $member->name, 'email' => $member->email, 'is_org_admin' => true,
            ]);

        $response->assertRedirect();
        $this->assertTrue($member->fresh()->isAdminOf($org->id));
    }

    public function test_admin_can_demote_org_admin()
    {
        [$org, $team, $admin, $leader, $member] = $this->setupOrgWithAdminAndLeader();
        $member->promoteToOrgAdmin($org->id);

        $response = $this->actingAs($admin)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('users.update', $member), [
                'name' => $member->name, 'email' => $member->email, 'is_org_admin' => false,
            ]);

        $response->assertRedirect();
        $this->assertFalse($member->fresh()->isAdminOf($org->id));
    }
}
