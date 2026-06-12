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
                'userTeams' => $request->user() ? $request->user()->teams()->get()->map(function($team) {
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
                'isOrgAdmin' => $request->user()?->is_org_admin ?? false,
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
