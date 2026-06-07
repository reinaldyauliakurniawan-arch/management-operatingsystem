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
        $meetings = Meeting::with('attendees')->latest()->get();
        return Inertia::render('L10Meeting/Index', [
            'meetings' => MeetingResource::collection($meetings),
        ]);
    }

    public function create()
    {
        $users = User::all(['id', 'name']);
        return Inertia::render('L10Meeting/Create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateMeeting $createMeeting)
    {
        $meeting = $createMeeting->execute($request->all());
        return redirect()->route('l10.workspace', $meeting->id);
    }

    public function workspace(Meeting $meeting)
    {
        return Inertia::render('L10Meeting/Workspace', [
            'meeting' => new MeetingResource($meeting),
            'rocks' => Rock::with('owner')->get(),
            'metrics' => Metric::with('owner', 'scores')->get(),
            'todos' => ToDo::with('owner')->where('is_completed', false)->get(),
            'issues' => Issue::with('owner')->where('status', 'open')->get(),
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
