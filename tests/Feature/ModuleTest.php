<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setupUser()
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        $team = Team::create([
            'organization_id' => $org->id,
            'name' => 'Test Team',
            'type' => 'leadership'
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => 'leader'
        ]);

        session(['active_team_id' => $team->id]);
        session(['active_organization_id' => $org->id]);

        return $user;
    }

    public function test_vto_accessible()
    {
        $response = $this->actingAs($this->setupUser())->withSession(['active_team_id' => 1])->get('/vto');
        $response->assertStatus(200);
    }

    public function test_rocks_accessible()
    {
        $user = $this->setupUser();
        $response = $this->actingAs($user)->withSession(['active_team_id' => session('active_team_id')])->get('/rocks');
        $response->assertStatus(200);
    }
}
