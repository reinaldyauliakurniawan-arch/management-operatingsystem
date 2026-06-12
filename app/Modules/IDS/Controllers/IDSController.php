<?php

namespace App\Modules\IDS\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\IDS\Actions\CreateIssue;
use App\Modules\IDS\Models\Issue;
use App\Modules\IDS\Resources\IssueResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IDSController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');
        $issues = Issue::with('owner')->where('team_id', $teamId)->orderBy('priority', 'desc')->get();
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        return Inertia::render('IDS/Index', [
            'issues' => IssueResource::collection($issues),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateIssue $createIssue)
    {
        $teamId = session('active_team_id');

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'nullable|integer|min:0|max:10',
            'owner_id'    => 'nullable|exists:users,id',
        ]);

        $validated['team_id']    = $teamId;
        $validated['priority']   = $validated['priority'] ?? 0;
        $createIssue->execute($validated);

        return back()->with('message', 'Issue dibuat.');
    }

    public function update(Request $request, Issue $issue)
    {
        $teamId = session('active_team_id');
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!in_array($role, ['leader', 'member'])) {
            abort(403, 'Tutor tidak bisa mengedit issue.');
        }

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'sometimes|integer|min:0|max:10',
            'owner_id'    => 'nullable|exists:users,id',
        ]);

        $issue->update([...$validated, 'updated_by' => $request->user()->id]);

        return back()->with('message', 'Issue diperbarui.');
    }

    public function resolve(Issue $issue)
    {
        $teamId = session('active_team_id');
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!in_array($role, ['leader', 'member'])) {
            abort(403, 'Tutor tidak bisa meresolve issue.');
        }

        $issue->update(['status' => 'resolved']);
        return back()->with('message', 'Issue resolved');
    }

    public function destroy(Issue $issue)
    {
        $teamId = session('active_team_id');
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa menghapus issue.');
        }

        $issue->delete();
        return back()->with('message', 'Issue deleted');
    }
}
