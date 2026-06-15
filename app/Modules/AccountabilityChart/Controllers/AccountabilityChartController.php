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
        $teamId = session("active_team_id");
        $orgId = session("active_organization_id");
        $bigPicture = $request->boolean("big_picture", false);

        if ($bigPicture && $orgId) {
            $teamIds = Team::where("organization_id", $orgId)->pluck("id");
            $seats = Seat::withoutGlobalScopes()
                ->with(["user", "children.user", "children.children.user", "children.children.children"])
                ->whereIn("team_id", $teamIds)
                ->whereNull("parent_id")
                ->orderBy("id")
                ->get();
        } else {
            $seats = Seat::withoutGlobalScopes()
                ->with(["user", "children.user", "children.children.user", "children.children.children"])
                ->where("team_id", $teamId)
                ->whereNull("parent_id")
                ->orderBy("id")
                ->get();
        }

        $users = $teamId
            ? User::whereHas(
                "teamMemberships",
                fn($q) => $q->where("team_id", $teamId),
            )->get(["id", "name"])
            : User::all(["id", "name"]);

        return Inertia::render("AccountabilityChart/Index", [
            "seats" => SeatResource::collection($seats)->collection->values(),
            "users" => $users,
            "bigPicture" => $bigPicture,
        ]);
    }

    public function store(
        Request $request,
        CreateSeat $createSeat,
        CreateUserAndAddToTeam $createUser,
    ) {
        $teamId = session("active_team_id");
        $role = $request
            ->user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader" && !$request->user()->is_org_admin) {
            abort(403, "Hanya leader atau org admin yang bisa menambah seat.");
        }

        // New user flow
        if ($request->boolean("create_new_user")) {
            $request->validate([
                "new_user_name" => "required|string|max:255",
                "new_user_email" => "required|email|unique:users,email",
                "new_user_role" => "required|in:leader,member,tutor",
                "title" => "required|string|max:255",
                "parent_id" => "nullable|exists:seats,id",
                "responsibilities" => "nullable|array",
            ]);

            $newUser = $createUser->execute(
                [
                    "name" => $request->new_user_name,
                    "email" => $request->new_user_email,
                    "role" => $request->new_user_role,
                ],
                $teamId,
            );

            $createSeat->execute([
                "title" => $request->title,
                "parent_id" => $request->parent_id,
                "user_id" => $newUser->id,
                "responsibilities" => $request->responsibilities,
            ]);

            return back()->with("message", "User dan seat berhasil dibuat.");
        }

        // Existing user flow
        $validated = $request->validate([
            "title" => "required|string|max:255",
            "parent_id" => "nullable|exists:seats,id",
            "user_id" => "nullable|exists:users,id",
            "responsibilities" => "nullable|array",
        ]);

        $createSeat->execute($validated);

        return back()->with("message", "Seat added");
    }

    public function update(Request $request, Seat $seat)
    {
        $teamId = session("active_team_id");
        $role = $request
            ->user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader" && !$request->user()->is_org_admin) {
            abort(403);
        }

        $validated = $request->validate([
            "title" => "sometimes|string|max:255",
            "parent_id" => "nullable|exists:seats,id",
            "user_id" => "nullable|exists:users,id",
            "responsibilities" => "nullable|array",
        ]);

        $seat->update($validated);
        return back()->with("message", "Seat updated");
    }

    public function destroy(Seat $seat)
    {
        $teamId = session("active_team_id");
        $role = request()
            ->user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader" && !request()->user()->is_org_admin) {
            abort(403);
        }

        $seat->delete();
        return back()->with("message", "Seat deleted");
    }
}
