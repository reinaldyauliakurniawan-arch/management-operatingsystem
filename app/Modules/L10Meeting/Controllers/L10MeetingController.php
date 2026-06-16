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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class L10MeetingController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");
        if ($role !== "leader") {
            abort(403, "Hanya leader yang bisa melakukan ini.");
        }
    }

    public function index()
    {
        $teamId = session("active_team_id");
        $meetings = Meeting::with("attendees")
            ->where("team_id", $teamId)
            ->latest("scheduled_at")
            ->get();

        return Inertia::render("L10Meeting/Index", [
            "meetings" => MeetingResource::collection($meetings),
        ]);
    }

    public function create()
    {
        $teamId = session("active_team_id");
        $users = $teamId
            ? User::whereHas(
                "teamMemberships",
                fn($q) => $q->where("team_id", $teamId),
            )->get(["id", "name"])
            : User::all(["id", "name"]);

        return Inertia::render("L10Meeting/Create", [
            "members" => $users,
        ]);
    }

    public function store(Request $request, CreateMeeting $createMeeting)
    {
        $this->requireLeader();

        $validated = $request->validate([
            "title" => "nullable|string|max:255",
            "scheduled_at" => "nullable|date",
            "attendee_ids" => "nullable|array",
            "attendee_ids.*" => "exists:users,id",
        ]);

        $meeting = $createMeeting->execute($validated);
        return redirect()->route("l10.workspace", $meeting->id);
    }

    public function workspace(Meeting $meeting)
    {
        $teamId = session("active_team_id");

        abort_unless($meeting->team_id === (int) $teamId, 403);

        $meeting->load("attendees");

        $rocks = Rock::with("owner")
            ->where("team_id", $teamId)
            ->where("status", "!=", "done")
            ->get();

        $metrics = Metric::with(["owner", "latestScore"])
            ->where("team_id", $teamId)
            ->get();

        $todos = ToDo::with("owner")
            ->where("team_id", $teamId)
            ->where("is_completed", false)
            ->orderBy("due_date")
            ->get();

        $issues = Issue::where("team_id", $teamId)
            ->where("status", "open")
            ->orderBy("priority", "desc")
            ->get();

        return Inertia::render("L10Meeting/Workspace", [
            "meeting" => new MeetingWorkspaceResource(
                $meeting,
                $rocks,
                $metrics,
                $todos,
                $issues,
            )->resolve(),
        ]);
    }

    /**
     * Start a scheduled meeting (set started_at = now).
     */
    public function start(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless(
            $meeting->team_id === (int) session("active_team_id"),
            403,
        );
        abort_if($meeting->started_at !== null, 422, "Meeting sudah dimulai.");

        $meeting->update(["started_at" => now()]);
        return back()->with("message", "Meeting dimulai.");
    }

    public function updateSegue(Request $request, Meeting $meeting)
    {
        $teamId = session("active_team_id");
        abort_unless($meeting->team_id === (int) $teamId, 403);
        abort_if($meeting->ended_at !== null, 422, "Meeting sudah selesai.");

        $validated = $request->validate([
            "segue_notes" => "nullable|string",
        ]);

        $meeting->update([...$validated, "updated_by" => Auth::id()]);

        return back()->with("message", "Catatan segue disimpan.");
    }

    public function updateHeadlines(Request $request, Meeting $meeting)
    {
        $teamId = session("active_team_id");
        abort_unless($meeting->team_id === (int) $teamId, 403);
        abort_if($meeting->ended_at !== null, 422, "Meeting sudah selesai.");

        $validated = $request->validate([
            "headlines_notes" => "nullable|string",
        ]);

        $meeting->update([...$validated, "updated_by" => Auth::id()]);

        return back()->with("message", "Headlines disimpan.");
    }

    public function updateConclude(Request $request, Meeting $meeting)
    {
        $teamId = session("active_team_id");
        abort_unless($meeting->team_id === (int) $teamId, 403);
        abort_if($meeting->ended_at !== null, 422, "Meeting sudah selesai.");

        $validated = $request->validate([
            "conclude_notes" => "nullable|string",
            "rating" => "nullable|numeric|min:1|max:10",
        ]);

        $meeting->update([...$validated, "updated_by" => Auth::id()]);

        return back()->with("message", "Catatan penutup disimpan.");
    }

    /**
     * Generate To-Do dari dalam L10 meeting.
     */
    public function createTodo(Request $request, Meeting $meeting)
    {
        $teamId = session("active_team_id");
        abort_unless($meeting->team_id === (int) $teamId, 403);

        $validated = $request->validate([
            "title" => "required|string|max:255",
            "owner_id" => "required_without:assignee_id|exists:users,id",
            "assignee_id" => "required_without:owner_id|exists:users,id",
            "due_date" => "required|date",
        ]);

        ToDo::create([
            "title" => $validated["title"],
            "owner_id" => $validated["owner_id"] ?? $validated["assignee_id"],
            "due_date" => $validated["due_date"],
            "team_id" => $teamId,
            "meeting_id" => $meeting->id,
            "created_by" => Auth::id(),
        ]);

        return back()->with("message", "To-Do ditambahkan dari meeting.");
    }

    /**
     * Raise Issue dari dalam L10 meeting.
     */
    public function createIssue(Request $request, Meeting $meeting)
    {
        $teamId = session("active_team_id");
        abort_unless($meeting->team_id === (int) $teamId, 403);

        $validated = $request->validate([
            "title" => "required|string|max:255",
            "description" => "nullable|string",
            "priority" => "nullable",
            "owner_id" => "nullable|exists:users,id",
        ]);

        $priority = $this->normalizePriority($validated["priority"] ?? null);

        Issue::create([
            "title" => $validated["title"],
            "description" => $validated["description"] ?? null,
            "priority" => $priority,
            "owner_id" => $validated["owner_id"] ?? Auth::id(),
            "team_id" => $teamId,
            "created_by" => Auth::id(),
        ]);

        return back()->with("message", "Issue diangkat dari meeting.");
    }

    public function finish(Request $request, Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless(
            $meeting->team_id === (int) session("active_team_id"),
            403,
        );

        $request->validate([
            "rating" => "nullable|numeric|min:1|max:10",
            "conclude_notes" => "nullable|string",
        ]);

        $meeting->update([
            "ended_at" => now(),
            "rating" => $request->input("rating", $meeting->rating),
            "conclude_notes" => $request->input(
                "conclude_notes",
                $meeting->conclude_notes,
            ),
            "updated_by" => Auth::id(),
        ]);

        return redirect()->route("l10.index");
    }

    public function destroy(Meeting $meeting)
    {
        $this->requireLeader();
        abort_unless(
            $meeting->team_id === (int) session("active_team_id"),
            403,
        );

        $meeting->delete();
        return back()->with("message", "Meeting dihapus.");
    }

    private function normalizePriority(mixed $priority): int
    {
        if (is_numeric($priority)) {
            return max(0, min(10, (int) $priority));
        }

        return match (strtolower((string) $priority)) {
            "high" => 8,
            "medium" => 5,
            "low" => 2,
            default => 0,
        };
    }
}
