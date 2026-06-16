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
        $teamId = session("active_team_id");
        $userId = Auth::id();
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");
        $isLeader = $role === "leader";

        $eventsQuery = Event::with([
            "attendances" => fn($q) => $isLeader
                ? $q->with("user")
                : $q->where("user_id", $userId),
        ])->where("team_id", $teamId);

        // Non-leader hanya lihat event yang di-assign ke role mereka atau ke semua
        if (!$isLeader) {
            $eventsQuery->where(function ($q) use ($role) {
                $q->whereNull("assigned_roles")->orWhereJsonContains(
                    "assigned_roles",
                    $role,
                );
            });
        }

        $events = $eventsQuery
            ->orderBy("event_date", "desc")
            ->get()
            ->map(function ($event) use ($userId, $isLeader) {
                $myAttendance = $event->attendances->first();
                return [
                    "id" => $event->id,
                    "name" => $event->name,
                    "type" => $event->type,
                    "event_date" => $event->event_date->format("Y-m-d"),
                    "description" => $event->description,
                    "assigned_roles" => $event->assigned_roles,
                    "attended_count" => $isLeader
                        ? $event->attendances->where("attended", true)->count()
                        : null,
                    "my_attended" => $myAttendance?->attended ?? false,
                    "is_past" => $event->event_date->isPast(),
                    "attendees" => $isLeader
                        ? $event->attendances
                            ->map(
                                fn($a) => [
                                    "id" => $a->user_id,
                                    "name" =>
                                        optional($a->user)->name ?? "(unknown)",
                                    "attended" => $a->attended,
                                ],
                            )
                            ->values()
                        : [],
                ];
            });

        $users =
            $isLeader && $teamId
                ? User::whereHas(
                    "teamMemberships",
                    fn($q) => $q->where("team_id", $teamId),
                )->get(["id", "name"])
                : collect();

        return Inertia::render("Event/Index", [
            "events" => $events,
            "users" => $users,
            "isLeader" => $isLeader,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader") {
            abort(403, "Hanya leader yang bisa membuat event.");
        }

        $validated = $request->validate([
            "name" => "required|string|max:255",
            "type" => "required|in:training,townhall",
            "event_date" => "required|date",
            "description" => "nullable|string",
            "assigned_roles" => "nullable|array",
            "assigned_roles.*" => "in:leader,member,tutor",
            "assigned_user_ids" => "nullable|array",
            "assigned_user_ids.*" => "exists:users,id",
        ]);

        $validated["team_id"] = $teamId;
        $validated["created_by"] = Auth::id();
        $assignedUserIds = $validated["assigned_user_ids"] ?? [];
        unset($validated["assigned_user_ids"]);
        $event = Event::create($validated);

        if (!empty($assignedUserIds)) {
            foreach ($assignedUserIds as $uid) {
                EventAttendance::firstOrCreate(
                    [
                        "event_id" => $event->id,
                        "user_id" => $uid,
                    ],
                    ["attended" => false],
                );
            }
        }

        return back()->with("message", "Event dibuat.");
    }

    public function update(Request $request, Event $event)
    {
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader") {
            abort(403);
        }

        if ($event->event_date->isPast()) {
            abort(422, "Event sudah lewat, tidak bisa diedit.");
        }

        $validated = $request->validate([
            "name" => "sometimes|string|max:255",
            "type" => "sometimes|in:training,townhall",
            "event_date" => "sometimes|date",
            "description" => "nullable|string",
            "assigned_roles" => "nullable|array",
        ]);

        $event->update($validated);

        return back()->with("message", "Event diperbarui.");
    }

    public function markAttended(Request $request, Event $event)
    {
        $userId = Auth::id();
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($event->team_id !== $teamId) {
            abort(403);
        }

        $assignedRoles = $event->assigned_roles ?? [];
        if (
            !empty($assignedRoles) &&
            ($role === null || !in_array($role, $assignedRoles, true))
        ) {
            abort(403, "Event ini tidak di-assign ke role kamu.");
        }

        EventAttendance::updateOrCreate(
            ["event_id" => $event->id, "user_id" => $userId],
            [
                "attended" => true,
                "marked_at" => now(),
                "marked_by" => $userId,
            ],
        );

        return back()->with("message", "Kehadiran dicatat.");
    }

    public function overrideAttendance(Request $request, Event $event)
    {
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader") {
            abort(403);
        }

        $request->validate([
            "user_id" => "required|exists:users,id",
            "attended" => "required|boolean",
        ]);

        EventAttendance::updateOrCreate(
            ["event_id" => $event->id, "user_id" => $request->user_id],
            [
                "attended" => $request->attended,
                "marked_at" => now(),
                "marked_by" => Auth::id(),
            ],
        );

        return back()->with("message", "Kehadiran di-override.");
    }

    public function destroy(Event $event)
    {
        $teamId = session("active_team_id");
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader") {
            abort(403);
        }

        $event->delete();

        return back()->with("message", "Event dihapus.");
    }
}
