<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;

class EnsureTeamRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        // ponytail: org admins of the active org bypass role checks.
        // Uses the per-org pivot (was global is_org_admin — closed C2).
        $user = $request->user();
        if ($user?->isAdminOfActiveOrg()) {
            return $next($request);
        }

        $teamId = TenantContext::teamId();

        if (!$teamId) {
            abort(403, 'Tidak ada active team.');
        }

        $role = $user?->teamMemberships()
            ->where('team_id', $teamId)
            ->value('role');

        if (!in_array($role, $roles)) {
            abort(403, 'Akses ditolak.');
        }

        return $next($request);
    }
}
