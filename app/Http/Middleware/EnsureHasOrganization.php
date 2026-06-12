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
        if (!Auth::check()) {
            return $next($request);
        }

        $user = $request->user();

        // Belum punya team sama sekali → buat org dulu
        if (!$user->teams()->exists()) {
            if (!$request->routeIs('organization.*') && !$request->routeIs('logout')) {
                return redirect()->route('organization.create');
            }
            return $next($request);
        }

        // Sudah punya team, tapi belum ada active_team_id di session
        if (!session('active_team_id')) {
            $teams = $user->teams()->get();

            if ($teams->count() === 1) {
                // Satu team → auto-set langsung
                $team = $teams->first();
                session([
                    'active_team_id'          => $team->id,
                    'active_organization_id'  => $team->organization_id,
                ]);
            } else {
                // Multi-team → arahkan ke team picker (kecuali sudah di sana)
                if (!$request->routeIs('team.pick') && !$request->routeIs('teams.switch') && !$request->routeIs('logout')) {
                    return redirect()->route('team.pick');
                }
            }
        }

        return $next($request);
    }
}
