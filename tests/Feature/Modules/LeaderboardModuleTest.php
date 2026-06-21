<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — Leaderboard module tests (was zero-test).
 */
class LeaderboardModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeam(): array
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create(['organization_id' => $org->id, 'name' => 'Team', 'type' => 'leadership']);
        $leader = User::factory()->create();
        $member = User::factory()->create();
        $otherUser = User::factory()->create(['name' => 'Marzha']);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $otherUser->id, 'role' => 'member']);
        \DB::table('organization_user')->insert([
            ['organization_id' => $org->id, 'user_id' => $leader->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $member->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $otherUser->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return [$org, $team, $leader, $member, $otherUser];
    }

    public function test_member_can_view_leaderboard()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('leaderboard.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('scores')->has('parameters')->has('members'));
    }

    public function test_member_cannot_create_parameter()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('leaderboard.parameters.store'), [
                'scheme' => 'management', 'name' => 'Training', 'input_type' => 'per_unit',
                'config' => ['weight' => 10],
            ]);

        $response->assertForbidden();
    }

    public function test_leader_can_create_parameter()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('leaderboard.parameters.store'), [
                'scheme' => 'management', 'name' => 'Training',
                'input_type' => 'per_unit', 'config' => ['weight' => 10],
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('leaderboard_parameters', ['name' => 'Training', 'team_id' => $team->id]);
    }

    public function test_leader_can_store_entry_for_any_org_member()
    {
        [$org, $team, $leader, $member, $otherUser] = $this->setupTeam();
        $param = LeaderboardParameter::create([
            'team_id' => $team->id, 'scheme' => 'management', 'name' => 'Training',
            'input_type' => 'per_unit', 'config' => ['weight' => 10], 'sort_order' => 0,
        ]);

        // ponytail: HR feedback fix #5 — leader harus bisa input poin untuk
        // SEMUA member di org, bukan cuma member team aktif (sebelumnya bug).
        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('leaderboard.entries.store'), [
                'parameter_id' => $param->id, 'user_id' => $otherUser->id,
                'quarter' => 'Q1', 'year' => 2026, 'raw_value' => 3,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('leaderboard_entries', [
            'parameter_id' => $param->id, 'user_id' => $otherUser->id,
            'quarter' => 'Q1', 'year' => 2026,
        ]);
    }

    public function test_member_cannot_store_entry()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $param = LeaderboardParameter::create([
            'team_id' => $team->id, 'scheme' => 'management', 'name' => 'Training',
            'input_type' => 'per_unit', 'config' => ['weight' => 10], 'sort_order' => 0,
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('leaderboard.entries.store'), [
                'parameter_id' => $param->id, 'user_id' => $member->id,
                'quarter' => 'Q1', 'year' => 2026, 'raw_value' => 5,
            ]);

        $response->assertForbidden();
    }
}
