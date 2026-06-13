<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadershipAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeamWithLeaderAndMember(): array
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Team',
            'type' => 'leadership',
        ]);

        $leader = User::factory()->create();
        $member = User::factory()->create();

        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);

        $this->seed(\Database\Seeders\LeadershipDataSeeder::class);

        return [$leader, $member, $team, $org];
    }

    public function test_index_renders_with_expected_props(): void
    {
        [$leader, , $team, $org] = $this->setupTeamWithLeaderAndMember();

        $this->actingAs($leader)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->get(route('leadership-assessment.index'))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('LeadershipAssessment/Index')
                ->has('cycles')
                ->has('types')
                ->has('pendingAssignments')
            );
    }

    public function test_leader_can_create_cycle_and_assign_assessee(): void
    {
        [$leader, $member, $team, $org] = $this->setupTeamWithLeaderAndMember();
        $typeId = LeadershipType::first()->id;

        $this->actingAs($leader)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->post(route('leadership-assessment.cycles.store'), [
                'name' => 'Q2 2026',
            ])
            ->assertRedirect();

        $cycle = AssessmentCycle::first();
        $this->assertNotNull($cycle);

        $this->actingAs($leader)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->post(route('leadership-assessment.cycles.assign', $cycle), [
                'user_id' => $member->id,
                'leadership_type_id' => $typeId,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('assessment_assignments', [
            'cycle_id' => $cycle->id,
            'user_id' => $member->id,
            'leadership_type_id' => $typeId,
        ]);
    }

    public function test_assessor_cannot_self_assess(): void
    {
        [$leader, , $team, $org] = $this->setupTeamWithLeaderAndMember();

        $cycle = AssessmentCycle::create([
            'team_id' => $team->id,
            'name' => 'Cycle',
            'status' => 'open',
            'created_by' => $leader->id,
        ]);

        $this->actingAs($leader)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->get(route('leadership-assessment.take', [
                'cycle' => $cycle->id,
                'assessee' => $leader->id,
            ]))
            ->assertStatus(403);
    }
}
