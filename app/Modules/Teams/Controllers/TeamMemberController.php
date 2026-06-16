<?php

namespace App\Modules\Teams\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    /**
     * List members of active team.
     * Leader: lihat semua. Member/tutor: hanya lihat, tidak bisa manage.
     */
    public function index(Request $request)
    {
        $teamId = $request->input("team_id", session("active_team_id"));
        $team = Team::with("members.user")->findOrFail($teamId);

        $members = $team->members->map(
            fn($m) => [
                "id" => $m->id,
                "user_id" => $m->user_id,
                "name" => $m->user->name,
                "email" => $m->user->email,
                "role" => $m->role,
                "is_integrator" => $m->is_integrator,
            ],
        );

        return response()->json(["members" => $members]);
    }

    /**
     * Org admin: tambah user ke team, atau leader assign role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            "team_id" => "required|exists:teams,id",
            "user_id" => "required|exists:users,id",
            "role" => "required|in:leader,member,tutor",
            "is_integrator" => "boolean",
        ]);

        $teamId = $validated["team_id"];
        $user = Auth::user();
        $role = $user
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if (!$user->is_org_admin && $role !== "leader") {
            abort(
                403,
                "Hanya org admin atau leader yang bisa menambah anggota.",
            );
        }

        // Cegah duplikat
        $existing = TeamMember::where("team_id", $teamId)
            ->where("user_id", $validated["user_id"])
            ->first();

        if ($existing) {
            return back()->withErrors([
                "user_id" => "User sudah menjadi anggota team ini.",
            ]);
        }

        TeamMember::create([
            "team_id" => $validated["team_id"],
            "user_id" => $validated["user_id"],
            "role" => $validated["role"],
            "is_integrator" => $validated["is_integrator"] ?? false,
        ]);

        return back()->with("message", "Anggota ditambahkan.");
    }

    /**
     * Leader: update role anggota di team-nya.
     */
    public function update(Request $request, TeamMember $member)
    {
        $teamId = session("active_team_id");
        $user = Auth::user();
        $role = $user
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if (!$user->is_org_admin && $role !== "leader") {
            abort(403);
        }

        // Pastikan member ini memang di team aktif
        abort_unless($member->team_id === (int) $teamId, 403);

        $validated = $request->validate([
            "role" => "required|in:leader,member,tutor",
            "is_integrator" => "boolean",
        ]);

        $member->update($validated);

        return back()->with("message", "Role diperbarui.");
    }

    /**
     * Org admin / leader: remove member dari team.
     */
    public function destroy(TeamMember $member)
    {
        $teamId = session("active_team_id");
        $user = Auth::user();
        $role = $user
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if (!$user->is_org_admin && $role !== "leader") {
            abort(
                403,
                "Hanya org admin atau leader yang bisa mengeluarkan anggota.",
            );
        }

        abort_unless($member->team_id === (int) $teamId, 403);

        // Cegah remove diri sendiri
        abort_if(
            $member->user_id === Auth::id(),
            422,
            "Tidak bisa mengeluarkan diri sendiri.",
        );

        $member->delete();

        return back()->with("message", "Anggota dikeluarkan dari team.");
    }
}
