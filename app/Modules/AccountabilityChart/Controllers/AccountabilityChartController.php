<?php

namespace App\Modules\AccountabilityChart\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AccountabilityChart\Actions\CreateSeat;
use App\Modules\AccountabilityChart\Actions\CreateUserAndAddToTeam;
use App\Modules\AccountabilityChart\Models\Seat;
use App\Modules\AccountabilityChart\Resources\SeatResource;
use App\Models\User;
use App\Modules\Teams\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountabilityChartController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render("AccountabilityChart/Index");
    }

    public function apiSeats(Request $request)
    {
        $orgId = session("active_organization_id");

        $withRelations = [
            "user",
            "children" => fn($q) => $q->withoutGlobalScopes(),
            "children.user",
            "children.children" => fn($q) => $q->withoutGlobalScopes(),
            "children.children.user",
            "children.children.children" => fn($q) => $q->withoutGlobalScopes(),
            "children.children.children.user",
        ];

        $teamIds = Team::withoutGlobalScopes()
            ->where("organization_id", $orgId)
            ->pluck("id");

        $seats = Seat::withoutGlobalScopes()
            ->with($withRelations)
            ->whereIn("team_id", $teamIds)
            ->whereNull("parent_id")
            ->orderBy("id")
            ->get();

        return response()->json([
            "seats" => SeatResource::collection($seats)->resolve(),
        ]);
    }

    public function apiUsers(Request $request)
    {
        $teamId = session("active_team_id");

        $users = $teamId
            ? User::whereHas("teamMemberships", fn($q) => $q->where("team_id", $teamId))
                ->get(["id", "name"])
            : User::all(["id", "name"]);

        return response()->json(["users" => $users]);
    }

    public function store(
        Request $request,
        CreateSeat $createSeat,
        CreateUserAndAddToTeam $createUser,
    ) {
        $teamId = session("active_team_id");
        $role = $request->user()->teamMemberships()->where("team_id", $teamId)->value("role");

        if ($role !== "leader" && !$request->user()->is_org_admin) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        if ($request->boolean("create_new_user")) {
            $request->validate([
                "new_user_name"    => "required|string|max:255",
                "new_user_email"   => "required|email|unique:users,email",
                "new_user_role"    => "required|in:leader,member,tutor",
                "title"            => "required|string|max:255",
                "parent_id"        => "nullable|exists:seats,id",
                "responsibilities" => "nullable|array",
            ]);

            $newUser = $createUser->execute([
                "name"  => $request->new_user_name,
                "email" => $request->new_user_email,
                "role"  => $request->new_user_role,
            ], $teamId);

            $createSeat->execute([
                "title"            => $request->title,
                "parent_id"        => $request->parent_id,
                "user_id"          => $newUser->id,
                "responsibilities" => $request->responsibilities,
            ]);

            return response()->json(["message" => "User dan seat berhasil dibuat."]);
        }

        $validated = $request->validate([
            "title"            => "required|string|max:255",
            "parent_id"        => "nullable|exists:seats,id",
            "user_id"          => "nullable|exists:users,id",
            "responsibilities" => "nullable|array",
        ]);

        $createSeat->execute($validated);

        return response()->json(["message" => "Seat added"]);
    }

    public function update(Request $request, int $seat)
    {
        $teamId = session("active_team_id");
        $role = $request->user()->teamMemberships()->where("team_id", $teamId)->value("role");

        if ($role !== "leader" && !$request->user()->is_org_admin) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        $validated = $request->validate([
            "title"            => "sometimes|string|max:255",
            "parent_id"        => "nullable|exists:seats,id",
            "user_id"          => "nullable|exists:users,id",
            "responsibilities" => "nullable|array",
        ]);

        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);
        $seatModel->update($validated);

        return response()->json(["message" => "Seat updated"]);
    }

    public function generateFromTeams(Request $request)
    {
        $teamId = session("active_team_id");
        $orgId  = session("active_organization_id");
        $role   = $request->user()->teamMemberships()->where("team_id", $teamId)->value("role");

        if ($role !== "leader" && !$request->user()->is_org_admin) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        $teams = Team::withoutGlobalScopes()
            ->with(["members", "members.user"])
            ->where("organization_id", $orgId)
            ->orderBy("parent_team_id")
            ->get();

        $teamToSeat = [];

        foreach ($teams as $team) {
            $existing = Seat::withoutGlobalScopes()->where("team_id", $team->id)->whereNull("parent_id")->first();
            if ($existing) {
                $teamToSeat[$team->id] = $existing->id;
                continue;
            }

            $leader       = $team->members->where("role", "leader")->first();
            $parentSeatId = $team->parent_team_id ? ($teamToSeat[$team->parent_team_id] ?? null) : null;

            // Buat seat untuk team (diisi leader)
            $teamSeat = Seat::create([
                "team_id"          => $team->id,
                "title"            => $team->name,
                "user_id"          => $leader?->user_id ?? null,
                "parent_id"        => $parentSeatId,
                "responsibilities" => [],
            ]);

            $teamToSeat[$team->id] = $teamSeat->id;

            // Buat seat untuk setiap member (non-leader)
            foreach ($team->members->where("role", "!=", "leader") as $member) {
                Seat::create([
                    "team_id"          => $team->id,
                    "title"            => "",
                    "user_id"          => $member->user_id,
                    "parent_id"        => $teamSeat->id,
                    "responsibilities" => [],
                ]);
            }
        }

        return response()->json(["message" => "Chart berhasil di-generate dari data tim."]);
    }

    public function destroy(int $seat)
    {
        $teamId = session("active_team_id");
        $role   = request()->user()->teamMemberships()->where("team_id", $teamId)->value("role");

        if ($role !== "leader" && !request()->user()->is_org_admin) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);
        $seatModel->delete();

        return response()->json(["message" => "Seat deleted"]);
    }
}
