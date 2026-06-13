<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use App\Modules\Organization\Actions\CreateOrganization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_org_creator_becomes_org_admin(): void
    {
        $user = User::factory()->create(['is_org_admin' => false]);

        $this->actingAs($user);

        $org = app(CreateOrganization::class)->execute(['name' => 'New Org']);

        $this->assertTrue($user->fresh()->is_org_admin);
        $this->assertDatabaseHas('organizations', ['id' => $org->id, 'name' => 'New Org']);
    }
}
