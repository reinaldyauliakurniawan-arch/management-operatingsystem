<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Modules\VTO\Models\VTOPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VTOTest extends TestCase
{
    use RefreshDatabase;

    public function test_vto_index_page_is_accessible()
    {
        $user = User::factory()->create();
        $organization = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        $user->update(['organization_id' => $organization->id]);

        $response = $this->actingAs($user)->get('/vto');

        $response->assertStatus(200);
        $this->assertDatabaseHas('vto_plans', [
            'organization_id' => $organization->id,
        ]);
    }

    public function test_vto_can_be_updated()
    {
        $user = User::factory()->create();
        $organization = Organization::create(['name' => 'Test Org', 'slug' => 'test-org']);
        $user->update(['organization_id' => $organization->id]);

        $response = $this->actingAs($user)->post('/vto', [
            'ten_year_target' => 'To be the best',
            'core_focus_purpose' => 'Helping people',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('vto_plans', [
            'organization_id' => $organization->id,
            'ten_year_target' => 'To be the best',
            'core_focus_purpose' => 'Helping people',
        ]);
    }
}
