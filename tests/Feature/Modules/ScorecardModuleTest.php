<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Models\WeeklyScore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — Scorecard module tests (was zero-test, only integration
 * test existed). Covers: metric CRUD (leader only), score logging (owner),
 * IDOR on metric.
 */
class ScorecardModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeam(): array
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create([
            'organization_id' => $org->id, 'name' => 'Team', 'type' => 'leadership',
            'q1_start_date' => now()->startOfYear()->format('Y-m-d'),
            'scorecard_day' => 1,
        ]);
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

    public function test_member_can_view_scorecard_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('scorecard.index'));

        $response->assertOk();
    }

    public function test_member_cannot_create_metric()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.store'), [
                'title' => 'Sales', 'owner_id' => $member->id,
                'goal_value' => 100, 'comparison_operator' => '>=',
            ]);

        $response->assertForbidden();
    }

    public function test_leader_can_create_metric()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.store'), [
                'title' => 'Weekly Sales', 'owner_id' => $member->id,
                'goal_value' => 50000, 'comparison_operator' => '>=',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('metrics', ['title' => 'Weekly Sales', 'team_id' => $team->id]);
    }

    public function test_invalid_comparison_operator_rejected()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.store'), [
                'title' => 'Bad Metric', 'owner_id' => $member->id,
                'goal_value' => 100, 'comparison_operator' => '!=',
            ]);

        $response->assertStatus(422);
    }

    public function test_member_can_log_score_for_own_metric()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $metric = Metric::create([
            'team_id' => $team->id, 'title' => 'Sales', 'owner_id' => $member->id,
            'goal_value' => 100, 'comparison_operator' => '>=',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.log-score'), [
                'metric_id' => $metric->id,
                'week_start_date' => now()->startOfWeek()->format('Y-m-d'),
                'actual_value' => 120,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('weekly_scores', ['metric_id' => $metric->id, 'actual_value' => 120]);
    }

    public function test_member_cannot_log_score_for_other_member_metric()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $other = User::factory()->create();
        TeamMember::create(['team_id' => $team->id, 'user_id' => $other->id, 'role' => 'member']);
        $metric = Metric::create([
            'team_id' => $team->id, 'title' => 'Other Sales', 'owner_id' => $other->id,
            'goal_value' => 100, 'comparison_operator' => '>=',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.log-score'), [
                'metric_id' => $metric->id,
                'week_start_date' => now()->startOfWeek()->format('Y-m-d'),
                'actual_value' => 50,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('weekly_scores', ['metric_id' => $metric->id, 'actual_value' => 50]);
    }

    public function test_leader_can_log_score_for_any_metric()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $metric = Metric::create([
            'team_id' => $team->id, 'title' => 'Member Sales', 'owner_id' => $member->id,
            'goal_value' => 100, 'comparison_operator' => '>=',
        ]);

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('scorecard.log-score'), [
                'metric_id' => $metric->id,
                'week_start_date' => now()->startOfWeek()->format('Y-m-d'),
                'actual_value' => 80,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('weekly_scores', ['metric_id' => $metric->id, 'actual_value' => 80]);
    }
}
