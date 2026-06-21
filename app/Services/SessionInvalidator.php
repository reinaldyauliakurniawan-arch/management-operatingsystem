<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * ponytail: helper to invalidate sessions for a user after authz changes.
 *
 * When an admin demotes a leader to member, resets a password, or toggles
 * is_org_admin, the user's existing session still caches the old role via
 * HandleInertiaRequests shared props. Forcing them to re-login is the only
 * way to guarantee the new role takes effect immediately.
 *
 * Laravel's session driver is `database` by default in this project, so we
 * can just delete rows by user_id. For other drivers this is a no-op
 * (file/cookie have no central session store).
 */
class SessionInvalidator
{
    public static function forUser(int $userId): void
    {
        try {
            DB::table('sessions')->where('user_id', $userId)->delete();
        } catch (\Throwable $e) {
            // ponytail: don't break the calling request if session table is
            // missing (e.g. during tests with array driver) — just log.
            report($e);
        }
    }
}
