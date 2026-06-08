<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasOrganization
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && !$request->user()->teams()->exists() && !$request->routeIs('organization.*') && !$request->routeIs('logout')) {
            return redirect()->route('organization.create');
        }

        // Auto-set active team if not set
        if (Auth::check() && !session('active_team_id')) {
            $team = $request->user()->teams()->first();
            if ($team) {
                session([
                    'active_team_id' => $team->id,
                    'active_organization_id' => $team->organization_id,
                ]);
            }
        }

        return $next($request);
    }
}
