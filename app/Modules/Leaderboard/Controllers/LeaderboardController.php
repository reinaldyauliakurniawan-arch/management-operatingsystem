<?php

namespace App\Modules\Leaderboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leaderboard\Actions\CalculateLeaderboardScores;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request, CalculateLeaderboardScores $calculator)
    {
        $teamId     = session('active_team_id');
        $dateFrom   = $request->input('date_from');
        $dateTo     = $request->input('date_to');

        $scores     = $calculator->execute($teamId, $dateFrom, $dateTo);
        $parameters = LeaderboardParameter::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->get();

        return Inertia::render('Leaderboard/Index', [
            'scores'     => $scores,
            'parameters' => $parameters,
            'filters'    => ['date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    // --- Parameter CRUD (leader only) ---

    public function storeParameter(Request $request)
    {
        $this->requireLeader();

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'max_points'     => 'required|numeric|min:0.1',
            'assigned_roles' => 'required|array|min:1',
            'assigned_roles.*' => 'in:leader,member,tutor',
            'is_automatic'   => 'boolean',
            'automatic_source' => 'nullable|string|in:rocks,scorecard,todos,events,leadership',
        ]);

        $validated['team_id'] = session('active_team_id');
        LeaderboardParameter::create($validated);

        return back()->with('message', 'Parameter ditambah.');
    }

    public function updateParameter(Request $request, LeaderboardParameter $parameter)
    {
        $this->requireLeader();

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'max_points'     => 'sometimes|numeric|min:0.1',
            'assigned_roles' => 'sometimes|array|min:1',
            'is_automatic'   => 'sometimes|boolean',
            'automatic_source' => 'nullable|string',
        ]);

        $parameter->update($validated);

        return back()->with('message', 'Parameter diperbarui.');
    }

    public function destroyParameter(LeaderboardParameter $parameter)
    {
        $this->requireLeader();
        $parameter->delete();
        return back()->with('message', 'Parameter dihapus.');
    }

    // --- Manual Entry CRUD (leader only) ---

    public function storeEntry(Request $request)
    {
        $this->requireLeader();

        $teamId = session('active_team_id');

        $validated = $request->validate([
            'parameter_id' => 'required|exists:leaderboard_parameters,id',
            'user_id'      => 'required|exists:users,id',
            'points'       => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        // Clamp to max_points
        $param = LeaderboardParameter::withoutGlobalScopes()
            ->where('id', $validated['parameter_id'])
            ->where('team_id', $teamId)
            ->firstOrFail();
        $validated['points'] = min($validated['points'], $param->max_points);
        $validated['team_id'] = $teamId;

        LeaderboardEntry::create($validated);

        return back()->with('message', 'Poin ditambah.');
    }

    public function updateEntry(Request $request, LeaderboardEntry $entry)
    {
        $this->requireLeader();

        $validated = $request->validate([
            'points' => 'required|numeric|min:0',
            'notes'  => 'nullable|string|max:500',
        ]);

        $param = LeaderboardParameter::withoutGlobalScopes()
            ->where('id', $entry->parameter_id)
            ->where('team_id', session('active_team_id'))
            ->firstOrFail();

        $validated['points'] = min($validated['points'], $param->max_points);

        $entry->update($validated);

        return back()->with('message', 'Poin diperbarui.');
    }

    public function destroyEntry(LeaderboardEntry $entry)
    {
        $this->requireLeader();
        $entry->delete();
        return back()->with('message', 'Entry dihapus.');
    }

    private function requireLeader(): void
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader') abort(403, 'Hanya leader.');
    }
}
