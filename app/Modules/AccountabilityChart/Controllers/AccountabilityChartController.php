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

        \Log::info('ACC CHART DEBUG', [
            'teamId' => $teamId,
            'orgId' => $orgId,
            'userId' => $request->user()?->id,
        ]);

        $withRelations = [
            "user",
            "children" => fn($q) => $q->withoutGlobalScopes(),
            "children.user",
            "children.children" => fn($q) => $q->withoutGlobalScopes(),
            "children.children.user",
            "children.children.children" => fn($q) => $q->withoutGlobalScopes(),
            "children.children.children.user",
        ];

        if ($bigPicture && $orgId) {
            $teamIds = Team::withoutGlobalScopes()->where("organization_id", $orgId)->pluck("id");
            $seats = Seat::withoutGlobalScopes()
                ->with($withRelations)
                ->whereIn("team_id", $teamIds)
                ->whereNull("parent_id")
                ->orderBy("id")
                ->get();
        } else {
            $teamIds = Team::withoutGlobalScopes()
                ->where("organization_id", $orgId)
                ->pluck("id");
            $seats = Seat::withoutGlobalScopes()
                ->with($withRelations)
                ->whereIn("team_id", $teamIds)
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
            "seats" => SeatResource::collection($seats)->resolve(),
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

    public function update(Request $request, int $seat)
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

        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);
        $seatModel->update($validated);
        return back()->with("message", "Seat updated");
    }

    public function generateFromTeams(Request $request)
    {
        $teamId = session('active_team_id');
        $orgId = session('active_organization_id');
        $role = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && !$request->user()->is_org_admin) {
            abort(403, 'Hanya leader atau org admin yang bisa generate chart.');
        }

        // Ambil semua team dalam org, urutkan parent dulu
        $teams = Team::withoutGlobalScopes()
            ->with(['members' => fn($q) => $q->where('role', 'leader'), 'members.user'])
            ->where('organization_id', $orgId)
            ->orderBy('parent_team_id')
            ->get();

        $teamToSeat = [];

        foreach ($teams as $team) {
            // Cek apakah seat dengan nama ini sudah ada untuk team ini
            $existing = Seat::withoutGlobalScopes()
                ->where('team_id', $team->id)
                ->first();

            if ($existing) {
                $teamToSeat[$team->id] = $existing->id;
                continue;
            }

            $leader = $team->members->first();
            $parentSeatId = $team->parent_team_id ? ($teamToSeat[$team->parent_team_id] ?? null) : null;

            $seat = Seat::create([
                'team_id'         => $team->id,
                'title'           => $team->name,
                'user_id'         => $leader?->user_id ?? null,
                'parent_id'       => $parentSeatId,
                'responsibilities' => [],
            ]);

            $teamToSeat[$team->id] = $seat->id;
        }

        return back()->with('message', 'Chart berhasil di-generate dari data tim.');
    }

    public function destroy(int $seat)
    {
        \Log::info('DESTROY SEAT', ['seat_id' => $seat]);
        $teamId = session("active_team_id");
        $role = request()
            ->user()
            ->teamMemberships()
            ->where("team_id", $teamId)
            ->value("role");

        if ($role !== "leader" && !request()->user()->is_org_admin) {
            abort(403);
        }

        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);
        \Log::info('FOUND SEAT', ['id' => $seatModel->id, 'title' => $seatModel->title]);
        $result = $seatModel->delete();
        \Log::info('DELETE RESULT', ['result' => $result]);
        return back()->with("message", "Seat deleted");
    }
}
