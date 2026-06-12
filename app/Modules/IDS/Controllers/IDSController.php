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
        $issues = Issue::with('owner')->orderBy('priority', 'desc')->get();
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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|integer',
            'owner_id' => 'nullable|exists:users,id',
        ]);

        $createIssue->execute($validated);

        return back()->with('message', 'Issue created');
    }

    public function resolve(Issue $issue)
    {
        $issue->update(['status' => 'resolved']);
        return back();
    }

    public function destroy(Issue $issue)
    {
        $issue->delete();
        return back();
    }
}
