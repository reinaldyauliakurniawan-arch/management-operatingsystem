<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');

        $events = Event::with('attendances')
            ->where('team_id', $teamId)
            ->orderBy('event_date', 'desc')
            ->get()
            ->map(function ($event) {
                $event->attended_count = $event->attendances->where('attended', true)->count();
                return $event;
            });

        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : collect();

        return Inertia::render('Event/Index', [
            'events' => $events,
            'users'  => $users,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat event.');
        }

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:training,townhall',
            'event_date'     => 'required|date',
            'description'    => 'nullable|string',
            'assigned_roles' => 'nullable|array',
            'assigned_roles.*' => 'in:leader,member,tutor',
        ]);

        $validated['team_id']    = $teamId;
        $validated['created_by'] = Auth::id();
        Event::create($validated);

        return back()->with('message', 'Event dibuat.');
    }

    public function update(Request $request, Event $event)
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403);
        }

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'type'           => 'sometimes|in:training,townhall',
            'event_date'     => 'sometimes|date',
            'description'    => 'nullable|string',
            'assigned_roles' => 'nullable|array',
        ]);

        $event->update($validated);

        return back()->with('message', 'Event diperbarui.');
    }

    public function markAttended(Request $request, Event $event)
    {
        $userId = Auth::id();

        EventAttendance::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $userId],
            [
                'attended'  => true,
                'marked_at' => now(),
                'marked_by' => $userId,
            ]
        );

        return back()->with('message', 'Kehadiran dicatat.');
    }

    public function overrideAttendance(Request $request, Event $event)
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403);
        }

        $request->validate([
            'user_id'  => 'required|exists:users,id',
            'attended' => 'required|boolean',
        ]);

        EventAttendance::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $request->user_id],
            [
                'attended'  => $request->attended,
                'marked_at' => now(),
                'marked_by' => Auth::id(),
            ]
        );

        return back()->with('message', 'Kehadiran di-override.');
    }

    public function destroy(Event $event)
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403);
        }

        $event->delete();

        return back()->with('message', 'Event dihapus.');
    }
}
