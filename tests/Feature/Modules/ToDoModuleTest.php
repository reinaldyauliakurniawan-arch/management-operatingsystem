<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\ToDo\Models\ToDo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — ToDo module tests (was zero-test).
 */
class ToDoModuleTest extends TestCase
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

    public function test_member_can_view_todos_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        ToDo::create([
            'team_id' => $team->id, 'title' => 'Test Todo', 'owner_id' => $leader->id,
            'due_date' => now()->addDays(3),
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('todos.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('todos')->has('users'));
    }

    public function test_member_can_create_todo()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('todos.store'), [
                'title' => 'New Todo', 'owner_id' => $member->id, 'due_date' => now()->addDays(3)->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('to_dos', ['title' => 'New Todo', 'team_id' => $team->id]);
    }

    public function test_owner_can_toggle_own_todo()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $todo = ToDo::create([
            'team_id' => $team->id, 'title' => 'Todo', 'owner_id' => $member->id,
            'due_date' => now()->addDays(3),
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('todos.toggle', $todo));

        $response->assertRedirect();
        $this->assertDatabaseHas('to_dos', ['id' => $todo->id, 'is_completed' => true]);
    }

    public function test_member_cannot_toggle_other_member_todo()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $other = User::factory()->create();
        TeamMember::create(['team_id' => $team->id, 'user_id' => $other->id, 'role' => 'member']);
        $todo = ToDo::create([
            'team_id' => $team->id, 'title' => 'Other Todo', 'owner_id' => $other->id,
            'due_date' => now()->addDays(3),
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->patch(route('todos.toggle', $todo));

        $response->assertForbidden();
    }

    public function test_member_cannot_carry_forward_todos()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('todos.carry-forward'));

        $response->assertForbidden();
    }
}
