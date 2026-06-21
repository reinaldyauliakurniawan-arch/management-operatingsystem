<?php

namespace Tests\Feature\Modules;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Event\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — Event module tests (was zero-test).
 */
class EventModuleTest extends TestCase
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

    public function test_member_can_view_events_index()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->get(route('events.index'));

        $response->assertOk();
    }

    public function test_member_cannot_create_event()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('events.store'), [
                'name' => 'Test Event', 'type' => 'training', 'event_date' => now()->addDays(7)->format('Y-m-d'),
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('events', ['name' => 'Test Event']);
    }

    public function test_leader_can_create_event()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('events.store'), [
                'name' => 'Training Session', 'type' => 'training',
                'event_date' => now()->addDays(7)->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('events', ['name' => 'Training Session', 'team_id' => $team->id]);
    }

    public function test_invalid_event_type_is_rejected()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();

        $response = $this->actingAs($leader)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('events.store'), [
                'name' => 'Bad Event', 'type' => 'banana',
                'event_date' => now()->addDays(7)->format('Y-m-d'),
            ]);

        $response->assertStatus(422);
    }

    public function test_member_can_mark_own_attendance()
    {
        [$org, $team, $leader, $member] = $this->setupTeam();
        $event = Event::create([
            'team_id' => $team->id, 'name' => 'Event', 'type' => 'training',
            'event_date' => now()->addDays(7)->format('Y-m-d'),
            'created_by' => $leader->id,
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('events.attend', $event));

        $response->assertRedirect();
        $this->assertDatabaseHas('event_attendances', [
            'event_id' => $event->id, 'user_id' => $member->id, 'attended' => true,
        ]);
    }
}
