<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Modules\L10Meeting\Models\Meeting;
use App\Modules\PeopleAnalyzer\Models\Evaluation;
use App\Modules\PeopleAnalyzer\Models\PeopleAnalyzerStandard;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\ToDo\Models\ToDo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class L10MeetingTest extends TestCase
{
    use RefreshDatabase;

    private function setupLeader(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Test Team',
            'type' => 'leadership',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => 'leader',
        ]);

        return [$user, $team, $org];
    }

    public function test_workspace_loads_with_nested_meeting_data(): void
    {
        [$user, $team, $org] = $this->setupLeader();

        $meeting = Meeting::create([
            'team_id' => $team->id,
            'title' => 'Weekly L10',
            'scheduled_at' => now()->addDay(),
            'created_by' => $user->id,
        ]);
        $meeting->attendees()->attach($user->id);

        $response = $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->get(route('l10.workspace', $meeting));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('L10Meeting/Workspace')
            ->has('meeting.data.rocks')
            ->has('meeting.data.metrics')
            ->has('meeting.data.todos')
            ->has('meeting.data.issues')
            ->where('meeting.data.title', 'Weekly L10')
        );
    }

    public function test_leader_can_start_and_finish_meeting(): void
    {
        [$user, $team, $org] = $this->setupLeader();

        $meeting = Meeting::create([
            'team_id' => $team->id,
            'title' => 'Weekly L10',
            'scheduled_at' => now()->addDay(),
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->post(route('l10.start', $meeting))
            ->assertRedirect();

        $meeting->refresh();
        $this->assertNotNull($meeting->started_at);

        $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->post(route('l10.finish', $meeting), [
                'rating' => 9,
                'conclude_notes' => 'Good meeting',
            ])
            ->assertRedirect(route('l10.index'));

        $meeting->refresh();
        $this->assertNotNull($meeting->ended_at);
        $this->assertEquals(9, (float) $meeting->rating);
        $this->assertEquals('Good meeting', $meeting->conclude_notes);
    }

    public function test_can_create_todo_from_meeting_with_assignee_id(): void
    {
        [$user, $team, $org] = $this->setupLeader();

        $meeting = Meeting::create([
            'team_id' => $team->id,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->post(route('l10.todos.store', $meeting), [
                'title' => 'Follow up vendor',
                'assignee_id' => $user->id,
                'due_date' => now()->addWeek()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('to_dos', [
            'team_id' => $team->id,
            'meeting_id' => $meeting->id,
            'title' => 'Follow up vendor',
            'owner_id' => $user->id,
        ]);
    }
}

class PeopleAnalyzerTest extends TestCase
{
    use RefreshDatabase;

    public function test_seat_fit_honors_capacity_requirement_from_standard(): void
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Team',
            'type' => 'leadership',
        ]);

        PeopleAnalyzerStandard::create([
            'team_id' => $team->id,
            'min_plus' => 3,
            'max_plus_minus' => 2,
            'max_minus' => 0,
            'gwc_get' => true,
            'gwc_want' => true,
            'gwc_capacity' => 'Y',
        ]);

        $evaluation = new Evaluation([
            'team_id' => $team->id,
            'gwc_get' => true,
            'gwc_want' => true,
            'gwc_capacity' => false,
            'core_values_scores' => [
                ['value' => 'Integrity', 'symbol' => '+'],
                ['value' => 'Innovation', 'symbol' => '+'],
                ['value' => 'Impact', 'symbol' => '+'],
            ],
        ]);

        $this->assertSame('right_person_wrong_seat', $evaluation->computeSeatFit());

        $evaluation->gwc_capacity = true;
        $this->assertSame('right_person_right_seat', $evaluation->computeSeatFit());
    }

    public function test_seat_fit_ignores_capacity_when_standard_allows_n(): void
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org-2']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Team',
            'type' => 'leadership',
        ]);

        PeopleAnalyzerStandard::create([
            'team_id' => $team->id,
            'min_plus' => 3,
            'max_plus_minus' => 2,
            'max_minus' => 0,
            'gwc_get' => true,
            'gwc_want' => true,
            'gwc_capacity' => 'N',
        ]);

        $evaluation = new Evaluation([
            'team_id' => $team->id,
            'gwc_get' => true,
            'gwc_want' => true,
            'gwc_capacity' => false,
            'core_values_scores' => [
                ['value' => 'Integrity', 'symbol' => '+'],
                ['value' => 'Innovation', 'symbol' => '+'],
                ['value' => 'Impact', 'symbol' => '+'],
            ],
        ]);

        $this->assertSame('right_person_right_seat', $evaluation->computeSeatFit());
    }
}

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_dashboard_stats_are_user_scoped(): void
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

        ToDo::create([
            'team_id' => $team->id,
            'title' => 'Leader todo overdue',
            'owner_id' => $leader->id,
            'due_date' => now()->subDay(),
        ]);

        ToDo::create([
            'team_id' => $team->id,
            'title' => 'Member todo today',
            'owner_id' => $member->id,
            'due_date' => today()->toDateString(),
        ]);

        $response = $this->actingAs($member)
            ->withSession([
                'active_team_id' => $team->id,
                'active_organization_id' => $org->id,
            ])
            ->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('stats.todos_overdue', 0)
            ->where('stats.todos_due_today', 1)
        );
    }
}
