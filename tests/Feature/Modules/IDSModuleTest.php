<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\IDS\Models\Issue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — IDS (Issues) module tests (was zero-test).
 */
class IDSModuleTest extends TestCase
{
    use RefreshDatabase;

    private function setupTeam(): array
    {
        $org = Organization::create(['name' => 'Org', 'slug' => 'org']);
        $team = Team::create(['organization_id' => $org->id, 'name' => 'Team', 'type' => 'leadership']);
        $leader = User::factory()->create();
        $member = User::factory()->create();
        $tutor = User::factory()->create();

        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $tutor->id, 'role' => 'tutor']);
        \DB::table('organization_user')->insert([
            ['organization_id' => $org->id, 'user_id' => $leader->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $member->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $tutor->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return [$org, $team, $leader, $member, $tutor];
    }

    public function test_member_can_view_issues_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        Issue::create([
            'team_id' => $team->id, 'title' => 'Test Issue', 'priority' => 5, 'status' => 'open',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('ids.index'));

        $response->assertOk();
    }

    public function test_member_can_create_issue()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('ids.store'), [
                'title' => 'New Issue', 'priority' => 7, 'owner_id' => $member->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('issues', ['title' => 'New Issue', 'team_id' => $team->id]);
    }

    public function test_tutor_cannot_create_issue()
    {
        [$org, $team, $leader, $member, $tutor] = $this->setupTeam();

        $response = $this->actingAs($tutor)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('ids.store'), [
                'title' => 'Tutor Issue', 'priority' => 5,
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('issues', ['title' => 'Tutor Issue']);
    }

    public function test_member_can_resolve_issue()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $issue = Issue::create([
            'team_id' => $team->id, 'title' => 'Issue', 'priority' => 5, 'status' => 'open',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('ids.resolve', $issue));

        $response->assertRedirect();
        $this->assertDatabaseHas('issues', ['id' => $issue->id, 'status' => 'resolved']);
    }

    public function test_tutor_cannot_resolve_issue()
    {
        [$org, $team, $leader, $member, $tutor] = $this->setupTeam();
        $issue = Issue::create([
            'team_id' => $team->id, 'title' => 'Issue', 'priority' => 5, 'status' => 'open',
        ]);

        $response = $this->actingAs($tutor)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('ids.resolve', $issue));

        $response->assertForbidden();
    }

    public function test_member_cannot_delete_issue()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $issue = Issue::create([
            'team_id' => $team->id, 'title' => 'Issue', 'priority' => 5, 'status' => 'open',
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->delete(route('ids.destroy', $issue));

        $response->assertForbidden();
        $this->assertDatabaseHas('issues', ['id' => $issue->id]);
    }
}
