<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'userTeams' => $request->user() ? $request->user()->teams()->withoutGlobalScopes()->get()->map(function($team) {
                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                        'role' => $team->pivot->role,
                    ];
                }) : [],
                'activeTeamId' => session('active_team_id'),
                'teamRole' => $request->user() ? (function() use ($request) {
                    $activeTeamId = session('active_team_id');
                    if (!$activeTeamId) return null;
                    $membership = $request->user()->teamMemberships()
                        ->where('team_id', $activeTeamId)
                        ->first();
                    return $membership?->role;
                })() : null,
                // ponytail: per-org admin check via organization_user pivot,
                // replacing the global is_org_admin flag. A user who is admin
                // of Org A but only a member of Org B will see isOrgAdmin=true
                // in Org A and false in Org B — closing the C2 cross-tenant
                // admin escalation hole from the audit.
                'isOrgAdmin' => $request->user()
                    ? $request->user()->isAdminOf(session('active_organization_id'))
                    : false,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
