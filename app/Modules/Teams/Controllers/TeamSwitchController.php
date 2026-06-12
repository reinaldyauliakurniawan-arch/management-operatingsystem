<?php

namespace App\Modules\Teams\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamSwitchController extends Controller
{
    public function pick()
{
    $teams = Auth::user()->teams()->get()->map(function($team) {
        return [
            'id' => $team->id,
            'name' => $team->name,
            'role' => $team->pivot->role,
        ];
    });

    return Inertia::render('Teams/Pick', ['teams' => $teams]);
}

public function store(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $user = Auth::user();

        // Validate user belongs to the team
        if (!$user->teams()->where('teams.id', $request->team_id)->exists()) {
            abort(403);
        }

        $team = \App\Modules\Teams\Models\Team::find($request->team_id);

        session([
            'active_team_id' => $team->id,
            'active_organization_id' => $team->organization_id,
        ]);

        return back();
    }
}
