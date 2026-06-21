<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\AccountabilityChart\Models\Seat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — AccountabilityChart module tests (was zero-test).
 */
class AccountabilityChartModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeam(): array
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

    public function test_member_can_view_chart_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('accountability.index'));

        $response->assertOk();
    }

    public function test_member_cannot_create_seat()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->postJson(route('accountability-chart.store'), [
                'title' => 'CEO',
            ]);

        $response->assertForbidden();
    }

    public function test_leader_can_create_seat()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->postJson(route('accountability-chart.store'), [
                'title' => 'CEO', 'user_id' => $leader->id,
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('seats', ['title' => 'CEO', 'team_id' => $team->id]);
    }

    public function test_leader_can_delete_own_team_seat()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $seat = Seat::create(['team_id' => $team->id, 'title' => 'CEO', 'user_id' => $leader->id]);

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->deleteJson(route('accountability-chart.destroy', $seat));

        $response->assertOk();
        $this->assertDatabaseMissing('seats', ['id' => $seat->id]);
    }

    public function test_leader_cannot_delete_other_team_seat()
    {
        [$org, $teamA, $leaderA, $memberA] = $this->setupTeam();
        $teamB = Team::create(['organization_id' => $org->id, 'name' => 'Team B', 'type' => 'leadership']);
        $leaderB = User::factory()->create();
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $leaderB->id, 'role' => 'leader']);
        $seatB = Seat::create(['team_id' => $teamB->id, 'title' => 'Boss B', 'user_id' => $leaderB->id]);

        $response = $this->actingAs($leaderA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $org->id])
            ->deleteJson(route('accountability-chart.destroy', $seatB));

        $response->assertForbidden();
        $this->assertDatabaseHas('seats', ['id' => $seatB->id]);
    }
}
