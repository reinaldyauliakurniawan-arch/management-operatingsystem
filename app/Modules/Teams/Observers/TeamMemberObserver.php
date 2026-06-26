<?php

namespace App\Modules\Teams\Observers;

use App\Modules\Teams\Models\TeamMember;
use Illuminate\Support\Facades\DB;

class TeamMemberObserver
{
    /**
     * ponytail: sync organization_user pivot whenever a TeamMember row is
     * created — regardless of the path (UI, tinker, seeder, API, factory).
     *
     * Uses insertOrIgnore so it is safe to call multiple times and does not
     * interfere with rows that already exist (e.g. a user in two teams of
     * the same org gets only one pivot row, as intended).
     *
     * Leader promotion: if the new member has role=leader, call
     * promoteToOrgAdmin() so they get is_admin=true in the pivot. This
     * mirrors what CreateOrganization already does for the founding leader.
     */
    public function created(TeamMember $member): void
    {
        $orgId = DB::table('teams')
            ->where('id', $member->team_id)
            ->value('organization_id');

        if (!$orgId) {
            return;
        }

        DB::table('organization_user')->insertOrIgnore([
            'organization_id' => $orgId,
            'user_id'         => $member->user_id,
            'is_admin'        => false,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        if ($member->role === 'leader') {
            $user = \App\Models\User::find($member->user_id);
            $user?->promoteToOrgAdmin($orgId);
        }
    }

    /**
     * ponytail: role changed to leader after the fact (e.g. via TeamMemberController::update)
     * → promote in org pivot so isAdminOfActiveOrg() returns true immediately.
     * Demotion from leader is intentionally NOT handled here — org admin status
     * is sticky and must be revoked explicitly via promoteToOrgAdmin/demoteFromOrgAdmin.
     */
    public function updated(TeamMember $member): void
    {
        if (!$member->wasChanged('role')) {
            return;
        }

        if ($member->role === 'leader') {
            $orgId = DB::table('teams')
                ->where('id', $member->team_id)
                ->value('organization_id');

            if ($orgId) {
                $user = \App\Models\User::find($member->user_id);
                $user?->promoteToOrgAdmin($orgId);
            }
        }
    }
}
