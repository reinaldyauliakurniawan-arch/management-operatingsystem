<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

/**
 * ponytail: minimal tenant context resolver.
 *
 * CRITICAL: the fallback queries use DB facade directly (NOT Eloquent models)
 * to avoid infinite recursion. If we used Auth::user()->teams()->first(),
 * the Team model's OrganizationScope would call TenantContext::organizationId()
 * again → infinite recursion → PHP hangs with no error logged.
 */
class TenantContext
{
    public static function organizationId(): ?int
    {
        if (Session::isStarted() && Session::has('active_organization_id')) {
            return (int) Session::get('active_organization_id');
        }

        if (Auth::check()) {
            // ponytail: use DB facade directly — bypasses Eloquent global scopes
            // that would cause infinite recursion (scope → TenantContext → scope → ...)
            $row = DB::table('team_members')
                ->join('teams', 'team_members.team_id', '=', 'teams.id')
                ->where('team_members.user_id', Auth::id())
                ->select('teams.organization_id')
                ->first();
            if ($row) {
                return $row->organization_id;
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
            // ponytail: same — DB facade, no Eloquent, no recursion
            $row = DB::table('team_members')
                ->where('user_id', Auth::id())
                ->select('team_id')
                ->first();
            if ($row) {
                return $row->team_id;
            }
        }

        return null;
    }
}
