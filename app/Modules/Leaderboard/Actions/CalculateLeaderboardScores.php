<?php
namespace App\Modules\Leaderboard\Actions;
use App\Modules\Teams\Models\Team;

class CalculateLeaderboardScores {
    public function execute(): \Illuminate\Support\Collection
    {
        $teamId = session('active_team_id');
        if (!$teamId) return collect();

        $team = Team::find($teamId);
        if (!$team) return collect();

        // TODO: implement setelah modul Event dan Leaderboard Config selesai
        return collect();
    }
}
