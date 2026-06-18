<?php

namespace App\Modules\Leaderboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leaderboard\Actions\CalculateLeaderboardScores;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Leaderboard\Models\LeaderboardEntry;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request, CalculateLeaderboardScores $calc)
    {
        $teamId = session("active_team_id");
        $year = (int) $request->input("year", now()->year);
        $quarter = $request->input("quarter", "Q" . ceil(now()->month / 3));

        $scores = $calc->execute($teamId, $quarter, $year);
        $parameters = LeaderboardParameter::where("team_id", $teamId)
            ->orderBy("sort_order")
            ->orderBy("id")
            ->get();

        $members = TeamMember::with("user")
            ->where("team_id", $teamId)
            ->get()
            ->map(
                fn($m) => [
                    "id" => $m->user_id,
                    "name" => $m->user->name,
                    "role" => $m->role,
                ],
            );

        return Inertia::render("Leaderboard/Index", [
            "scores" => $scores,
            "parameters" => $parameters,
            "members" => $members,
            "filters" => compact("year", "quarter"),
        ]);
    }

    // --- Parameters ---

    public function storeParameter(Request $request)
    {
        $this->requireLeader();
        $v = $request->validate([
            "scheme" => "required|in:tutor,management",
            "name" => "required|string|max:255",
            "input_type" => "required|in:per_unit,tiered,normalized,auto",
            "config" => "nullable|array",
            "sort_order" => "integer|min:0",
        ]);
        $v["team_id"] = session("active_team_id");
        $v["created_by"] = Auth::id();
        LeaderboardParameter::create($v);
        return back()->with("message", "Parameter ditambah.");
    }

    public function updateParameter(
        Request $request,
        LeaderboardParameter $parameter,
    ) {
        $this->requireLeader();
        $v = $request->validate([
            "name" => "sometimes|string|max:255",
            "input_type" => "sometimes|in:per_unit,tiered,normalized,auto",
            "config" => "nullable|array",
            "sort_order" => "sometimes|integer|min:0",
        ]);
        $v["updated_by"] = Auth::id();
        $parameter->update($v);
        return back()->with("message", "Parameter diperbarui.");
    }

    public function destroyParameter(LeaderboardParameter $parameter)
    {
        $this->requireLeader();
        $parameter->delete();
        return back()->with("message", "Parameter dihapus.");
    }

    // --- Entries ---

    public function storeEntry(Request $request)
    {
        $this->requireLeader();
        $teamId = session("active_team_id");
        $v = $request->validate([
            "parameter_id" => "required|exists:leaderboard_parameters,id",
            "user_id" => "required|exists:users,id",
            "quarter" => "required|in:Q1,Q2,Q3,Q4",
            "year" => "required|integer|min:2020|max:2099",
            "raw_value" => "required|numeric",
            "notes" => "nullable|string|max:500",
        ]);

        $param = LeaderboardParameter::where("id", $v["parameter_id"])
            ->where("team_id", $teamId)
            ->firstOrFail();
        $points = $param->calculatePoints((float) $v["raw_value"]);

        LeaderboardEntry::updateOrCreate(
            [
                "team_id" => $teamId,
                "parameter_id" => $v["parameter_id"],
                "user_id" => $v["user_id"],
                "quarter" => $v["quarter"],
                "year" => $v["year"],
            ],
            [
                "raw_value" => $v["raw_value"],
                "points" => $points,
                "notes" => $v["notes"] ?? null,
                "created_by" => Auth::id(),
                "updated_by" => Auth::id(),
            ],
        );

        return back()->with("message", "Poin disimpan.");
    }

    public function updateEntry(Request $request, LeaderboardEntry $entry)
    {
        $this->requireLeader();
        $v = $request->validate([
            "raw_value" => "required|numeric",
            "notes" => "nullable|string|max:500",
        ]);
        $points = $entry->parameter->calculatePoints((float) $v["raw_value"]);
        $entry->update([
            "raw_value" => $v["raw_value"],
            "points" => $points,
            "notes" => $v["notes"] ?? null,
            "updated_by" => Auth::id(),
        ]);
        return back()->with("message", "Entry diperbarui.");
    }

    public function destroyEntry(LeaderboardEntry $entry)
    {
        $this->requireLeader();
        $entry->delete();
        return back()->with("message", "Entry dihapus.");
    }

    public function recalculate(Request $request)
    {
        $this->requireLeader();
        $v = $request->validate([
            "quarter" => "required|in:Q1,Q2,Q3,Q4",
            "year" => "required|integer",
        ]);
        $teamId = session("active_team_id");

        $entries = LeaderboardEntry::where("team_id", $teamId)
            ->where("quarter", $v["quarter"])
            ->where("year", $v["year"])
            ->with("parameter")
            ->get();

        foreach ($entries as $entry) {
            $entry->update([
                "points" => $entry->parameter->calculatePoints(
                    $entry->raw_value,
                ),
                "updated_by" => Auth::id(),
            ]);
        }

        return back()->with(
            "message",
            "Recalculate {$v["quarter"]} {$v["year"]} selesai.",
        );
    }

    private function requireLeader(): void
    {
        $role = Auth::user()
            ->teamMemberships()
            ->where("team_id", session("active_team_id"))
            ->value("role");
        abort_if($role !== "leader", 403);
    }
}
