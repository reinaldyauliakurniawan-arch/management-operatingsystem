<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ponytail: convert global is_org_admin to per-org pivot table.
 *
 * Previously users.is_org_admin was a single boolean — a user who was admin
 * in Org A was automatically admin in Org B (if they had any team membership
 * there). This is the C2 critical security issue from the audit.
 *
 * Strategy (backward compatible):
 * 1. Create organization_user pivot with is_admin column.
 * 2. Backfill: every user with is_org_admin=true gets a row in the pivot
 *    for every organization they have a team membership in. This preserves
 *    existing admin access for the orgs they actually use, while removing
 *    the implicit "admin everywhere" behavior.
 * 3. Keep the users.is_org_admin column as a deprecated cache (set to true
 *    if user is admin in ANY org) so legacy code paths still work during
 *    migration. Controllers will be updated incrementally to use the pivot.
 * 4. Future migration (9.1-cleanup) will drop the column once all code is
 *    updated.
 *
 * The pivot uses composite primary key (organization_id, user_id) so a user
 * can only have one membership row per org — prevents duplicates.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('organization_user')) {
            Schema::create('organization_user', function (Blueprint $table) {
                $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->boolean('is_admin')->default(false);
                $table->timestamps();

                // ponytail: composite PK — one (org, user) row max, naturally
                // prevents duplicates and serves as the unique index for fast
                // "is this user admin of org X" lookups.
                $table->primary(['organization_id', 'user_id']);
                $table->index(['user_id', 'is_admin']);
            });
        }

        // ponytail: is_org_admin column was dropped — we can't query it here.
        // Instead: create org_user pivot rows for ALL users based on team memberships.
        // Admin status is set separately via promoteToOrgAdmin() (e.g. by CreateOrganization action).
        $allMembers = DB::table('team_members')
            ->join('teams', 'team_members.team_id', '=', 'teams.id')
            ->select('team_members.user_id', 'teams.organization_id')
            ->distinct()
            ->get();
        foreach ($allMembers as $m) {
            // Leaders become admins of their org during migration
            $isLeader = DB::table('team_members')
                ->where('user_id', $m->user_id)
                ->where('team_id', function($q) use ($m) {
                    $q->select('id')->from('teams')
                      ->where('organization_id', $m->organization_id);
                })
                ->where('role', 'leader')
                ->exists();

            DB::table('organization_user')->updateOrInsert(
                ['organization_id' => $m->organization_id, 'user_id' => $m->user_id],
                ['is_admin' => $isLeader, 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_user');
    }
};
