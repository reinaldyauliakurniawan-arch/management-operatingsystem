<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

/**
 * ponytail: minimal tenant context resolver.
 *
 * Resolves active organization/team id from session (web request),
 * falling back to the authenticated user's first team. Returns null
 * in pure CLI/artisan so migrations/seeders can run unscoped; the
 * scopes throw in non-CLI production requests to fail closed.
 */
class TenantContext
{
    public static function organizationId(): ?int
    {
        if (Session::isStarted() && Session::has('active_organization_id')) {
            return (int) Session::get('active_organization_id');
        }

        if (Auth::check()) {
            $team = Auth::user()?->teams()->first();
            if ($team) {
                return $team->organization_id;
            }
        }

        return null;
    }

    public static function teamId(): ?int
    {
        if (Session::isStarted() && Session::has('active_team_id')) {
            return (int) Session::get('active_team_id');
        }

        if (Auth::check()) {
            $team = Auth::user()?->teams()->first();
            if ($team) {
                return $team->id;
            }
        }

        return null;
    }
}
