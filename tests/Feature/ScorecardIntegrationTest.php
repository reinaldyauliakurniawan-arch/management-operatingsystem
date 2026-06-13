<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Modules\IDS\Models\Issue;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Models\WeeklyScore;
use App\Modules\Scorecard\Actions\LogWeeklyScore;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScorecardIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeated_red_scorecard_creates_issue(): void
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Team',
            'type' => 'leadership',
        ]);
        $user = User::factory()->create();
        TeamMember::create(['team_id' => $team->id, 'user_id' => $user->id, 'role' => 'leader']);

        $metric = Metric::create([
            'team_id' => $team->id,
            'title' => 'Weekly Complaints',
            'owner_id' => $user->id,
            'goal_value' => 5,
            'comparison_operator' => '<=',
        ]);

        $logger = app(LogWeeklyScore::class);

        $logger->execute([
            'metric_id' => $metric->id,
            'week_start_date' => Carbon::now()->startOfWeek()->subWeek()->toDateString(),
            'actual_value' => 20,
            'created_by' => $user->id,
        ]);

        $this->assertDatabaseMissing('issues', [
            'title' => 'Scorecard merah berulang: Weekly Complaints',
        ]);

        $logger->execute([
            'metric_id' => $metric->id,
            'week_start_date' => Carbon::now()->startOfWeek()->toDateString(),
            'actual_value' => 25,
            'created_by' => $user->id,
        ]);

        $this->assertDatabaseHas('issues', [
            'team_id' => $team->id,
            'title' => 'Scorecard merah berulang: Weekly Complaints',
            'status' => 'open',
        ]);
    }
}
