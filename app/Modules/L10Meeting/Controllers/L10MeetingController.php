<?php

namespace App\Modules\L10Meeting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\L10Meeting\Actions\CreateMeeting;
use App\Modules\L10Meeting\Models\Meeting;
use App\Modules\L10Meeting\Resources\MeetingResource;
use App\Modules\L10Meeting\Resources\MeetingWorkspaceResource;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\ToDo\Models\ToDo;
use App\Modules\IDS\Models\Issue;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class L10MeetingController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = TenantContext::teamId();
        $role = Auth::user()->roleIn($teamId);
        if ($role !== 'leader' && !Auth::user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa melakukan ini.');
        }
    }

    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
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
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $users = User::inTeam($teamId);

        $team = \App\Modules\Teams\Models\Team::withoutGlobalScopes()->find($teamId);
        $scorecardDay = $team?->scorecard_day ?? 1;

        $now = \Carbon\Carbon::now();
        $next = $now->copy()->next($scorecardDay === 0 ? \Carbon\Carbon::SUNDAY : $scorecardDay);
        if ($now->dayOfWeek === $scorecardDay) {
            $next = $now->copy();
        }
        $next->setTime(9, 0);

        return Inertia::render('L10Meeting/Create', [
            'members'         => $users,
            'next_scheduled'  => $next->format('Y-m-d\TH:i'),
        ]);
    }

    public function store(Request $request, CreateMeeting $createMeeting)
    {
        $this->requireLeader();
        $teamId = TenantContext::teamId();

        $validated = $request->validate([
            'title'           => 'nullable|string|max:255',
            'scheduled_at'    => 'nullable|date',
            'attendee_ids'    => 'nullable|array',
            'attendee_ids.*'  => [Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
        ]);

        $meeting = $createMeeting->execute($validated);
        return redirect()->route('l10.workspace', $meeting->id);
    }

    public function workspace(Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');

        $meeting->load('attendees');

        $rocks = Rock::with('owner')
            ->where('team_id', $teamId)
            ->where('status', '!=', 'done')
            ->get();

        $metrics = Metric::with(['owner', 'latestScore'])
            ->where('team_id', $teamId)
            ->get();

        $todos = ToDo::with('owner')
            ->where('team_id', $teamId)
            ->where('is_completed', false)
            ->orderBy('due_date')
            ->get();

        $issues = Issue::where('team_id', $teamId)
            ->where('status', 'open')
            ->orderBy('priority', 'desc')
            ->get();

        $resource = new MeetingWorkspaceResource($meeting, $rocks, $metrics, $todos, $issues);

        return Inertia::render('L10Meeting/Workspace', [
            'meeting' => $resource->resolve(),
        ]);
    }

    public function start(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === TenantContext::teamId(), 403, 'Meeting bukan milik team aktif.');
        abort_if($meeting->started_at !== null, 422, 'Meeting sudah dimulai.');

        $meeting->update(['started_at' => now()]);
        return back()->with('message', 'Meeting dimulai.');
    }

    public function updateSegue(Request $request, Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');
        abort_if($meeting->ended_at !== null, 422, 'Meeting sudah selesai.');

        $validated = $request->validate(['segue_notes' => 'nullable|string']);
        $meeting->update([...$validated, 'updated_by' => Auth::id()]);

        return back()->with('message', 'Catatan segue disimpan.');
    }

    public function updateHeadlines(Request $request, Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');
        abort_if($meeting->ended_at !== null, 422, 'Meeting sudah selesai.');

        $validated = $request->validate(['headlines_notes' => 'nullable|string']);
        $meeting->update([...$validated, 'updated_by' => Auth::id()]);

        return back()->with('message', 'Headlines disimpan.');
    }

    public function updateConclude(Request $request, Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');
        abort_if($meeting->ended_at !== null, 422, 'Meeting sudah selesai.');

        $validated = $request->validate([
            'conclude_notes' => 'nullable|string',
            'rating'         => 'nullable|numeric|min:1|max:10',
        ]);

        $meeting->update([...$validated, 'updated_by' => Auth::id()]);

        return back()->with('message', 'Catatan penutup disimpan.');
    }

    public function createTodo(Request $request, Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'owner_id'    => ['required_without:assignee_id', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'assignee_id' => ['required_without:owner_id', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'due_date'    => 'required|date',
        ]);

        ToDo::create([
            'title'      => $validated['title'],
            'owner_id'   => $validated['owner_id'] ?? $validated['assignee_id'],
            'due_date'   => $validated['due_date'],
            'team_id'    => $teamId,
            'meeting_id' => $meeting->id,
            'created_by' => Auth::id(),
        ]);

        return back()->with('message', 'To-Do ditambahkan dari meeting.');
    }

    public function createIssue(Request $request, Meeting $meeting)
    {
        $teamId = TenantContext::teamId();
        abort_unless($meeting->team_id === $teamId, 403, 'Meeting bukan milik team aktif.');

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'root_cause'  => 'nullable|string',
            'solution'    => 'nullable|string',
            'priority'    => 'nullable',
            'owner_id'    => ['nullable', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
        ]);

        $priority = $this->normalizePriority($validated['priority'] ?? null);

        Issue::create([
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'root_cause'  => $validated['root_cause'] ?? null,
            'solution'    => $validated['solution'] ?? null,
            'priority'    => $priority,
            'owner_id'    => $validated['owner_id'] ?? Auth::id(),
            'team_id'     => $teamId,
            'created_by'  => Auth::id(),
        ]);

        return back()->with('message', 'Issue diangkat dari meeting.');
    }

    public function finish(Request $request, Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === TenantContext::teamId(), 403, 'Meeting bukan milik team aktif.');

        $request->validate([
            'rating'         => 'nullable|numeric|min:1|max:10',
            'conclude_notes' => 'nullable|string',
        ]);

        $meeting->update([
            'ended_at'       => now(),
            'rating'         => $request->input('rating', $meeting->rating),
            'conclude_notes' => $request->input('conclude_notes', $meeting->conclude_notes),
            'updated_by'     => Auth::id(),
        ]);

        return redirect()->route('l10.index');
    }

    public function destroy(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless($meeting->team_id === TenantContext::teamId(), 403, 'Meeting bukan milik team aktif.');

        $meeting->delete();
        return back()->with('message', 'Meeting dihapus.');
    }

    private function normalizePriority(mixed $priority): int
    {
        if (is_numeric($priority)) {
            return max(0, min(10, (int) $priority));
        }

        return match (strtolower((string) $priority)) {
            'high'   => 8,
            'medium' => 5,
            'low'    => 2,
            default  => 0,
        };
    }
}
