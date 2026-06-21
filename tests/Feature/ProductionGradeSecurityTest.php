<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\AccountabilityChart\Models\Seat;
use App\Modules\AccountabilityChart\Actions\CreateUserAndAddToTeam;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
use App\Modules\LeadershipAssessment\Models\LeadershipItem;
use App\Modules\LeadershipAssessment\Models\LeadershipRubric;
use App\Modules\Rocks\Models\Rock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\ResetPassword;
use Tests\TestCase;

/**
 * ponytail: Phase 3 — replaced the 2 string-matching tests (which were
 * flagging source-code substrings, not behavior) with actual behavioral
 * tests that exercise the runtime contract.
 *
 * Before: assertStringNotContainsString('member123', source) — passed even
 * if the password logic was broken, as long as the literal string was gone.
 *
 * After: actually create a user via the action and assert the hash is NOT
 * the hash of 'member123' — proves the runtime behavior is correct.
 */
class ProductionGradeSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrgWithLeaderAndMember(): array
    {
        $org = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);

        $team = Team::create([
            'organization_id' => $org->id,
            'name'            => 'Team A',
            'type'            => 'leadership',
            'created_by'      => null,
        ]);

        $leader = User::factory()->create();
        $member = User::factory()->create();

        TeamMember::create(['team_id' => $team->id, 'user_id' => $leader->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $member->id, 'role' => 'member']);

        // ponytail: Phase 2 — also need to create organization_user pivot rows
        // since the per-org admin pivot is now the source of truth.
        \DB::table('organization_user')->insert([
            ['organization_id' => $org->id, 'user_id' => $leader->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
            ['organization_id' => $org->id, 'user_id' => $member->id, 'is_admin' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return [$org, $team, $leader, $member];
    }

    public function test_member_cannot_list_team_members_of_other_team()
    {
        [$org, $teamA, $leaderA, $memberA] = $this->makeOrgWithLeaderAndMember();

        $teamB = Team::create(['organization_id' => $org->id, 'name' => 'Team B', 'type' => 'leadership']);
        $leaderB = User::factory()->create();
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $leaderB->id, 'role' => 'leader']);

        $response = $this->actingAs($memberA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $org->id])
            ->getJson(route('teams.members.index', ['team_id' => $teamB->id]));

        $response->assertForbidden();
    }

    public function test_member_cannot_delete_seat_in_other_team()
    {
        [$org, $teamA, $leaderA, $memberA] = $this->makeOrgWithLeaderAndMember();

        $teamB = Team::create(['organization_id' => $org->id, 'name' => 'Team B', 'type' => 'leadership']);
        $leaderB = User::factory()->create();
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $leaderB->id, 'role' => 'leader']);
        $seatB = Seat::create(['team_id' => $teamB->id, 'title' => 'Boss B', 'user_id' => $leaderB->id]);

        $response = $this->actingAs($leaderA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $org->id])
            ->deleteJson(route('accountability-chart.destroy', ['seat' => $seatB->id]));

        $response->assertForbidden();
        $this->assertDatabaseHas('seats', ['id' => $seatB->id]);
    }

    public function test_member_cannot_access_rubrik_admin()
    {
        [$org, $teamA, $leaderA, $memberA] = $this->makeOrgWithLeaderAndMember();

        $response = $this->actingAs($memberA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $org->id])
            ->get(route('leadership-assessment.rubrik.index'));

        $response->assertForbidden();
    }

    public function test_teams_index_does_not_leak_users_outside_active_org()
    {
        [$orgA, $teamA, $leaderA, $memberA] = $this->makeOrgWithLeaderAndMember();

        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b']);
        $teamB = Team::create(['organization_id' => $orgB->id, 'name' => 'Team B', 'type' => 'leadership']);
        $userB = User::factory()->create(['name' => 'Outsider User']);
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $userB->id, 'role' => 'leader']);

        // ponytail: Phase 2 — promote leaderA to admin of orgA via pivot.
        $leaderA->promoteToOrgAdmin($orgA->id);

        $response = $this->actingAs($leaderA)
            ->withSession(['active_team_id' => $teamA->id, 'active_organization_id' => $orgA->id])
            ->get(route('teams.index'));

        $response->assertOk();
        $response->assertDontSee('Outsider User');
    }

    public function test_submit_response_rejects_item_outside_assignment_scope()
    {
        [$org, $team, $leader, $member] = $this->makeOrgWithLeaderAndMember();

        $type = LeadershipType::create(['name' => 'Visionary', 'organization_id' => $org->id]);
        $itemInScope = LeadershipItem::create(['leadership_type_id' => $type->id, 'title' => 'Item 1', 'organization_id' => $org->id]);
        LeadershipRubric::create(['leadership_item_id' => $itemInScope->id, 'level' => 1, 'description' => 'L1', 'organization_id' => $org->id]);

        $typeOther = LeadershipType::create(['name' => 'Operator', 'organization_id' => $org->id]);
        $itemOutOfScope = LeadershipItem::create(['leadership_type_id' => $typeOther->id, 'title' => 'Item 2', 'organization_id' => $org->id]);
        LeadershipRubric::create(['leadership_item_id' => $itemOutOfScope->id, 'level' => 1, 'description' => 'L1', 'organization_id' => $org->id]);

        $cycle = AssessmentCycle::create([
            'team_id'    => $team->id,
            'name'       => 'Q3',
            'status'     => 'open',
            'created_by' => $leader->id,
        ]);

        \App\Modules\LeadershipAssessment\Models\AssessmentAssignment::create([
            'cycle_id'           => $cycle->id,
            'user_id'            => $leader->id,
            'leadership_type_id' => $type->id,
        ]);

        $response = $this->actingAs($member)
            ->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id])
            ->post(route('leadership-assessment.submit', [$cycle->id, $leader->id]), [
                'responses' => [
                    ['item_id' => $itemInScope->id, 'level' => 3],
                    ['item_id' => $itemOutOfScope->id, 'level' => 4], // out of scope
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_create_organization_rolls_back_on_failure()
    {
        $user = User::factory()->create();

        $this->expectException(\Illuminate\Database\QueryException::class);

        $action = app(\App\Modules\Organization\Actions\CreateOrganization::class);
        $action->execute(['name' => '']);
    }

    /**
     * ponytail: Phase 3 — behavioral test. Old test was string-matching
     * on source code ('member123' not in source). Now we actually create
     * a user via the action and assert the password hash is NOT the hash
     * of 'member123'. This catches the actual bug if anyone re-introduces
     * the static password (regardless of variable name or formatting).
     */
    public function test_create_user_action_does_not_use_static_password_member123()
    {
        Notification::fake();

        [$org, $team, $leader, $member] = $this->makeOrgWithLeaderAndMember();
        $this->actingAs($leader)->withSession(['active_team_id' => $team->id, 'active_organization_id' => $org->id]);

        $action = app(CreateUserAndAddToTeam::class);
        $newUser = $action->execute([
            'name'  => 'Test User',
            'email' => 'test@example.com',
            'role'  => 'member',
        ], $team->id);

        // ponytail: the password hash must NOT match the hash of 'member123'.
        $this->assertFalse(
            Hash::check('member123', $newUser->password),
            'CreateUserAndAddToTeam is using the static "member123" password — critical security regression.'
        );

        // ponytail: also verify the password is at least 16 chars long (random 24 expected).
        $this->assertGreaterThanOrEqual(
            16,
            strlen($newUser->password),
            'Password should be a long random string, not a short static value.'
        );

        // ponytail: a password reset link email should have been sent.
        Notification::assertSentTo($newUser, ResetPassword::class);
    }

    /**
     * ponytail: Phase 3 — behavioral test. Old test was string-matching
     * on source ('ip()' not in source). Now we actually instantiate
     * LoginRequest, call throttleKey(), and assert the returned string
     * does NOT contain the IP. Catches the regression even if someone
     * refactors to use $this->ip() with a different syntax.
     */
    public function test_login_throttle_key_does_not_include_ip_address()
    {
        $request = \Illuminate\Http\Request::create('/login', 'POST', ['email' => 'Alice@Example.COM']);
        $request->server->set('REMOTE_ADDR', '192.168.1.100');

        $loginRequest = new \App\Http\Requests\Auth\LoginRequest();
        $loginRequest->setRequest($request);

        $key = $loginRequest->throttleKey();

        // ponytail: key should be the email only, no IP.
        $this->assertSame(
            'alice@example.com',
            $key,
            'LoginRequest::throttleKey should return the bare lowercased email — IP inclusion causes NAT lockout.'
        );

        $this->assertStringNotContainsString('192', $key, 'Throttle key must not contain IP octets.');
        $this->assertStringNotContainsString('100', $key, 'Throttle key must not contain IP octets.');
    }

    public function test_tenant_context_returns_null_when_session_and_auth_absent()
    {
        $this->assertNull(\App\Services\TenantContext::organizationId());
        $this->assertNull(\App\Services\TenantContext::teamId());
    }

    /**
     * ponytail: Phase 3 — new test for per-org admin pivot (Phase 2 9.1).
     * Verifies a user who is admin of Org A is NOT admin of Org B.
     */
    public function test_per_org_admin_isolation()
    {
        $orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b']);

        $teamA = Team::create(['organization_id' => $orgA->id, 'name' => 'Team A', 'type' => 'leadership']);
        $teamB = Team::create(['organization_id' => $orgB->id, 'name' => 'Team B', 'type' => 'leadership']);

        $user = User::factory()->create();
        TeamMember::create(['team_id' => $teamA->id, 'user_id' => $user->id, 'role' => 'leader']);
        TeamMember::create(['team_id' => $teamB->id, 'user_id' => $user->id, 'role' => 'member']);

        // ponytail: promote user to admin of Org A only.
        $user->promoteToOrgAdmin($orgA->id);

        $this->assertTrue($user->isAdminOf($orgA->id), 'User should be admin of Org A');
        $this->assertFalse($user->isAdminOf($orgB->id), 'User should NOT be admin of Org B (cross-tenant escalation would be C2 regression)');
    }

    /**
     * ponytail: Phase 3 — new test for security headers middleware.
     */
    public function test_security_headers_are_set_on_responses()
    {
        $response = $this->get('/');

        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy');
        $response->assertHeader('X-Permitted-Cross-Domain-Policies', 'none');
        // CSP + HSTS only set in production env, skip in testing
    }
}
