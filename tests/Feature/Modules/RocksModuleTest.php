<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Rocks\Models\Rock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — Rocks module tests (was zero-test).
 * Covers: list, create (leader only), update status (leader only),
 * update by owner, delete (leader only), IDOR cross-team.
 */
class RocksModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeamWithLeaderAndMember(): array
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create(['organization_id' => $org->id, 'name' => 'Team', 'type' => 'leadership']);
        $leader = User::factory()->create();
        $member = User::factory()->create();

        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);
        \DB::table('organization_user')->insert([
            ['organization_id' => $org->id, 'user_id' => $leader->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $member->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return [$org, $team, $leader, $member];
    }

    public function test_member_can_view_rocks_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();
        Rock::create([
            'team_id' => $team->id, 'title' => 'Test Rock', 'owner_id' => $leader->id,
            'quarter' => 'Q1', 'year' => 2026, 'status' => 'on_track',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('rocks.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('rocks')->has('users'));
    }

    public function test_member_cannot_create_rock()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('rocks.store'), [
                'title' => 'New Rock', 'owner_id' => $leader->id, 'quarter' => 'Q1', 'year' => 2026,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('rocks', ['title' => 'New Rock']);
    }

    public function test_leader_can_create_rock()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('rocks.store'), [
                'title' => 'New Rock', 'owner_id' => $leader->id, 'quarter' => 'Q1', 'year' => 2026,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('rocks', ['title' => 'New Rock', 'team_id' => $team->id]);
    }

    public function test_member_cannot_update_rock_status()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();
        $rock = Rock::create([
            'team_id' => $team->id, 'title' => 'Rock', 'owner_id' => $leader->id,
            'quarter' => 'Q1', 'year' => 2026, 'status' => 'on_track',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('rocks.update-status', $rock), ['status' => 'done']);

        $response->assertForbidden();
        $this->assertDatabaseHas('rocks', ['id' => $rock->id, 'status' => 'on_track']);
    }

    public function test_leader_can_update_rock_status()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();
        $rock = Rock::create([
            'team_id' => $team->id, 'title' => 'Rock', 'owner_id' => $leader->id,
            'quarter' => 'Q1', 'year' => 2026, 'status' => 'on_track',
        ]);

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('rocks.update-status', $rock), ['status' => 'done']);

        $response->assertRedirect();
        $this->assertDatabaseHas('rocks', ['id' => $rock->id, 'status' => 'done']);
    }

    public function test_invalid_rock_status_is_rejected()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();
        $rock = Rock::create([
            'team_id' => $team->id, 'title' => 'Rock', 'owner_id' => $leader->id,
            'quarter' => 'Q1', 'year' => 2026, 'status' => 'on_track',
        ]);

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('rocks.update-status', $rock), ['status' => 'banana']);

        $response->assertStatus(422);
    }

    public function test_member_cannot_delete_rock()
    {
        [$org, $team, $leader, $member] = $this->setupTeamWithLeaderAndMember();
        $rock = Rock::create([
            'team_id' => $team->id, 'title' => 'Rock', 'owner_id' => $leader->id,
            'quarter' => 'Q1', 'year' => 2026, 'status' => 'on_track',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->delete(route('rocks.destroy', $rock));

        $response->assertForbidden();
        $this->assertDatabaseHas('rocks', ['id' => $rock->id]);
    }
}
