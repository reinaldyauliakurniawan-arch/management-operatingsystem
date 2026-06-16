<?php

namespace App\Modules\Teams\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Teams\Models\Team;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamController extends Controller
{
    private function requireOrgAdmin(): void
    {
        if (!Auth::user()->is_org_admin) {
            abort(403, "Hanya org admin yang bisa mengelola team.");
        }
    }

    public function index()
    {
        $orgId = session("active_organization_id");

        $teams = Team::withoutGlobalScopes()
            ->with(["members.user"])
            ->where("organization_id", $orgId)
            ->get()
            ->map(
                fn($team) => [
                    "id" => $team->id,
                    "name" => $team->name,
                    "type" => $team->type,
                    "parent_team_id" => $team->parent_team_id,
                    "member_count" => $team->members->count(),
                    "leaders" => $team->members
                        ->where("role", "leader")
                        ->map(
                            fn($m) => [
                                "id" => $m->user_id,
                                "name" => $m->user->name ?? "",
                            ],
                        )
                        ->values(),
                ],
            );

        $allUsers = \App\Models\User::all(["id", "name", "email"]);

        return Inertia::render("Teams/Index", [
            "teams" => $teams,
            "allUsers" => $allUsers,
            "allSystemUsers" => \App\Models\User::orderBy("name")->get([
                "id",
                "name",
                "email",
                "is_org_admin",
                "created_at",
            ]),
        ]);
    }

    public function users()
    {
        $this->requireOrgAdmin();
        $users = \App\Models\User::orderBy("name")->get([
            "id",
            "name",
            "email",
            "is_org_admin",
            "created_at",
        ]);
        $teams = \App\Modules\Teams\Models\Team::where(
            "organization_id",
            session("active_organization_id"),
        )->get(["id", "name"]);
        $allUsers = $users;
        return inertia("Teams/Index", [
            "teams" => \App\Modules\Teams\Models\Team::withoutGlobalScopes()
                ->with(["members.user"])
                ->where("organization_id", session("active_organization_id"))
                ->get()
                ->map(
                    fn($team) => [
                        "id" => $team->id,
                        "name" => $team->name,
                        "type" => $team->type,
                        "parent_team_id" => $team->parent_team_id,
                        "member_count" => $team->members->count(),
                        "leaders" => $team->members
                            ->where("role", "leader")
                            ->map(
                                fn($m) => [
                                    "id" => $m->user_id,
                                    "name" => $m->user->name,
                                ],
                            )
                            ->values(),
                    ],
                ),
            "allUsers" => $allUsers,
            "allSystemUsers" => $users,
            "defaultTab" => "users",
        ]);
    }

    public function updateUser(Request $request, \App\Models\User $user)
    {
        $this->requireOrgAdmin();
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => "required|email|unique:users,email," . $user->id,
            "is_org_admin" => "boolean",
        ]);
        $user->update($validated);
        return back()->with("message", "User diperbarui.");
    }

    public function resetPassword(Request $request, \App\Models\User $user)
    {
        $this->requireOrgAdmin();
        $validated = $request->validate([
            "password" => "required|string|min:8",
        ]);
        $user->update(["password" => bcrypt($validated["password"])]);
        return back()->with("message", "Password direset.");
    }

    public function destroyUser(\App\Models\User $user)
    {
        $this->requireOrgAdmin();
        abort_if(
            $user->id === auth()->id(),
            422,
            "Tidak bisa menghapus akun sendiri.",
        );
        $user->delete();
        return back()->with("message", "User dihapus.");
    }

    public function storeUser(Request $request)
    {
        $this->requireOrgAdmin();
        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => "required|email|unique:users,email",
            "password" => "required|string|min:8",
            "is_org_admin" => "boolean",
            "team_id" => "nullable|exists:teams,id",
            "role" => "nullable|in:leader,member,tutor",
        ]);

        $user = \App\Models\User::create([
            "name" => $validated["name"],
            "email" => $validated["email"],
            "password" => bcrypt($validated["password"]),
            "is_org_admin" => $validated["is_org_admin"] ?? false,
        ]);

        if (!empty($validated["team_id"]) && !empty($validated["role"])) {
            \App\Modules\Teams\Models\TeamMember::create([
                "team_id" => $validated["team_id"],
                "user_id" => $user->id,
                "role" => $validated["role"],
            ]);
        }

        return back()->with("message", "User berhasil dibuat.");
    }

    public function store(Request $request)
    {
        $this->requireOrgAdmin();

        $validated = $request->validate([
            "name" => "required|string|max:255",
            "type" => "required|in:leadership,departmental,project",
            "parent_team_id" => "nullable|exists:teams,id",
            "leader_user_id" => "required|exists:users,id",
        ]);

        $orgId = session("active_organization_id");

        $team = Team::create([
            "organization_id" => $orgId,
            "name" => $validated["name"],
            "type" => $validated["type"],
            "parent_team_id" => $validated["parent_team_id"] ?? null,
            "created_by" => Auth::id(),
        ]);

        // Auto-assign leader
        \App\Modules\Teams\Models\TeamMember::create([
            "team_id" => $team->id,
            "user_id" => $validated["leader_user_id"],
            "role" => "leader",
        ]);

        return back()->with("message", "Team dibuat.");
    }

    public function update(Request $request, Team $team)
    {
        $this->requireOrgAdmin();

        $validated = $request->validate([
            "name" => "sometimes|string|max:255",
            "type" => "sometimes|in:leadership,departmental,project",
            "parent_team_id" => "nullable|exists:teams,id",
        ]);

        // Cegah circular parent
        if (
            isset($validated["parent_team_id"]) &&
            $validated["parent_team_id"] === $team->id
        ) {
            abort(422, "Team tidak bisa menjadi parent dirinya sendiri.");
        }

        $team->update(array_merge($validated, ["updated_by" => Auth::id()]));

        return back()->with("message", "Team diperbarui.");
    }

    public function assignLeader(Request $request, Team $team)
    {
        $this->requireOrgAdmin();

        $validated = $request->validate([
            "user_id" => "required|exists:users,id",
        ]);

        // Pastikan user sudah jadi member, lalu update role-nya ke leader
        $member = \App\Modules\Teams\Models\TeamMember::where(
            "team_id",
            $team->id,
        )
            ->where("user_id", $validated["user_id"])
            ->first();

        if ($member) {
            $member->update(["role" => "leader"]);
        } else {
            \App\Modules\Teams\Models\TeamMember::create([
                "team_id" => $team->id,
                "user_id" => $validated["user_id"],
                "role" => "leader",
            ]);
        }

        return back()->with("message", "Leader di-assign.");
    }

    public function destroy(Team $team)
    {
        $this->requireOrgAdmin();

        // Soft delete — data historis tetap
        $team->delete();

        // Jika ini active team, clear session
        if (session("active_team_id") === $team->id) {
            session()->forget(["active_team_id", "active_organization_id"]);
        }

        return back()->with("message", "Team dihapus.");
    }
}
