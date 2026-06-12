<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTeamRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $teamId = session('active_team_id');

        if (!$teamId) {
            abort(403, 'Tidak ada active team.');
        }

        $role = $request->user()?->teamMemberships()
            ->where('team_id', $teamId)
            ->value('role');

        if (!in_array($role, $roles)) {
            abort(403, 'Akses ditolak.');
        }

        return $next($request);
    }
}
