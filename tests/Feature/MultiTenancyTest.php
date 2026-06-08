<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Rocks\Models\Rock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenancyTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_cannot_see_rocks_from_other_teams()
    {
        $org = Organization::create(['name' => 'Org 1', 'slug' => 'org-1']);

        $team1 = Team::create(['organization_id' => $org->id, 'name' => 'Team 1', 'type' => 'leadership']);
        $user1 = User::factory()->create();
        TeamMember::create(['team_id' => $team1->id, 'user_id' => $user1->id, 'role' => 'leader']);
        $rock1 = Rock::create([
            'team_id' => $team1->id,
            'title' => 'Rock 1',
            'owner_id' => $user1->id,
            'quarter' => 'Q1',
            'year' => 2024,
        ]);

        $team2 = Team::create(['organization_id' => $org->id, 'name' => 'Team 2', 'type' => 'leadership']);
        $user2 = User::factory()->create();
        TeamMember::create(['team_id' => $team2->id, 'user_id' => $user2->id, 'role' => 'leader']);
        $rock2 = Rock::create([
            'team_id' => $team2->id,
            'title' => 'Rock 2',
            'owner_id' => $user2->id,
            'quarter' => 'Q1',
            'year' => 2024,
        ]);

        // Acting as User 1 with Team 1 context
        $this->actingAs($user1)->withSession(['active_team_id' => $team1->id, 'active_organization_id' => $org->id]);
        $this->assertEquals(1, Rock::count());
        $this->assertEquals('Rock 1', Rock::first()->title);

        // Acting as User 2 with Team 2 context
        $this->actingAs($user2)->withSession(['active_team_id' => $team2->id, 'active_organization_id' => $org->id]);
        $this->assertEquals(1, Rock::count());
        $this->assertEquals('Rock 2', Rock::first()->title);
    }
}
