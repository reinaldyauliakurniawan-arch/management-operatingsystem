<?php

namespace App\Modules\L10Meeting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\L10Meeting\Actions\CreateMeeting;
use App\Modules\L10Meeting\Models\Meeting;
use App\Modules\L10Meeting\Resources\MeetingResource;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\ToDo\Models\ToDo;
use App\Modules\IDS\Models\Issue;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class L10MeetingController extends Controller
{
    public function index()
    {
        $teamId   = session('active_team_id');
        $meetings = Meeting::with('attendees')->where('team_id', $teamId)->latest()->get();
        return Inertia::render('L10Meeting/Index', [
            'meetings' => MeetingResource::collection($meetings),
        ]);
    }

    public function create()
    {
        $teamId = session('active_team_id');
        $users  = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);
        return Inertia::render('L10Meeting/Create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateMeeting $createMeeting)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat meeting.');
        }

        $validated = $request->validate([
            'attendee_ids'   => 'nullable|array',
            'attendee_ids.*' => 'exists:users,id',
        ]);

        $meeting = $createMeeting->execute($validated);
        return redirect()->route('l10.workspace', $meeting->id);
    }

    public function workspace(Meeting $meeting)
    {
        $teamId = session('active_team_id');

        return Inertia::render('L10Meeting/Workspace', [
            'meeting' => new MeetingResource($meeting),
            'rocks'   => Rock::with('owner')->where('team_id', $teamId)->get(),
            'metrics' => Metric::with('owner', 'scores')->where('team_id', $teamId)->get(),
            'todos'   => ToDo::with('owner')->where('team_id', $teamId)->where('is_completed', false)->get(),
            'issues'  => Issue::with('owner')->where('team_id', $teamId)->where('status', 'open')->get(),
        ]);
    }

    public function finish(Request $request, Meeting $meeting)
    {
        $meeting->update([
            'ended_at' => now(),
            'rating' => $request->rating,
        ]);
        return redirect()->route('l10.index');
    }
}
