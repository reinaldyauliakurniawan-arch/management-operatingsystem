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
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class L10MeetingController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader') abort(403, 'Hanya leader yang bisa melakukan ini.');
    }

    public function index()
    {
        $teamId   = session('active_team_id');
        $meetings = Meeting::with('attendees')
            ->where('team_id', $teamId)
            ->latest('scheduled_at')
            ->get();

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
        $this->requireLeader();

        $validated = $request->validate([
            'title'          => 'nullable|string|max:255',
            'scheduled_at'   => 'nullable|date',
            'attendee_ids'   => 'nullable|array',
            'attendee_ids.*' => 'exists:users,id',
        ]);

        $meeting = $createMeeting->execute($validated);
        return redirect()->route('l10.workspace', $meeting->id);
    }

    public function workspace(Meeting $meeting)
    {
        $teamId = session('active_team_id');

        // Pastikan meeting milik team aktif
        abort_unless($meeting->team_id === (int) $teamId, 403);

        return Inertia::render('L10Meeting/Workspace', [
            'meeting' => new MeetingResource($meeting->load('attendees')),
            'rocks'   => Rock::with('owner')->where('team_id', $teamId)->get(),
            'metrics' => Metric::with(['owner', 'scores' => fn($q) => $q->latest()->limit(1)])->where('team_id', $teamId)->get(),
            'todos'   => ToDo::with('owner')->where('team_id', $teamId)->where('is_completed', false)->orderBy('due_date')->get(),
            'issues'  => Issue::with('owner')->where('team_id', $teamId)->where('status', 'open')->orderBy('priority', 'desc')->get(),
        ]);
    }

    /**
     * Start a scheduled meeting (set started_at = now).
     */
    public function start(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === (int) session('active_team_id'), 403);
        abort_if($meeting->started_at !== null, 422, 'Meeting sudah dimulai.');

        $meeting->update(['started_at' => now()]);
        return back()->with('message', 'Meeting dimulai.');
    }

    /**
     * Generate To-Do dari dalam L10 meeting.
     */
    public function createTodo(Request $request, Meeting $meeting)
    {
        $teamId = session('active_team_id');
        abort_unless($meeting->team_id === (int) $teamId, 403);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'owner_id' => 'required|exists:users,id',
            'due_date' => 'required|date',
        ]);

        ToDo::create([
            ...$validated,
            'team_id'    => $teamId,
            'meeting_id' => $meeting->id,
            'created_by' => Auth::id(),
        ]);

        return back()->with('message', 'To-Do ditambahkan dari meeting.');
    }

    /**
     * Raise Issue dari dalam L10 meeting.
     */
    public function createIssue(Request $request, Meeting $meeting)
    {
        $teamId = session('active_team_id');
        abort_unless($meeting->team_id === (int) $teamId, 403);

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'nullable|integer|min:0|max:10',
            'owner_id'    => 'nullable|exists:users,id',
        ]);

        Issue::create([
            ...$validated,
            'team_id'    => $teamId,
            'priority'   => $validated['priority'] ?? 0,
            'created_by' => Auth::id(),
        ]);

        return back()->with('message', 'Issue diangkat dari meeting.');
    }

    public function finish(Request $request, Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === (int) session('active_team_id'), 403);

        $request->validate([
            'rating' => 'nullable|numeric|min:1|max:10',
        ]);

        $meeting->update([
            'ended_at'   => now(),
            'rating'     => $request->rating,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->route('l10.index');
    }

    public function destroy(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === (int) session('active_team_id'), 403);

        $meeting->delete();
        return back()->with('message', 'Meeting dihapus.');
    }
}
