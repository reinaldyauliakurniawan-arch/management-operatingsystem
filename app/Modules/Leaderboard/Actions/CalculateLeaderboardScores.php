<?php
namespace App\Modules\Leaderboard\Actions;
use App\Models\User;
use App\Modules\Performance\Models\PerformanceEntry;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use App\Modules\Training\Models\Training;
use App\Modules\Training\Models\TrainingAttendance;
use App\Modules\ScoreParameters\Models\ScoreParameter;
use App\Modules\Teams\Models\Team;
use Illuminate\Support\Facades\Auth;

class CalculateLeaderboardScores {
    public function execute() {
        $teamId = session('active_team_id');
        if (!$teamId) return collect();

        $team = Team::find($teamId);
        if (!$team) return collect();

        $users = $team->users;
        $params = ScoreParameter::all()->pluck('weight', 'slug');
        $totalTrainings = Training::count();

        return $users->map(function($u) use ($params, $totalTrainings) {
            // Performance Score (avg of all entries)
            $perfAvg = PerformanceEntry::where('user_id', $u->id)->avg('value') ?? 0;

            // Leadership Score (avg rubric level / 5 * 100)
            $leadAvg = AssessmentResponse::where('assessee_id', $u->id)->avg('rubric_level') ?? 0;
            $leadScore = ($leadAvg / 5) * 100;

            // Training Score (% attended)
            $attended = TrainingAttendance::where('user_id', $u->id)->where('attended', true)->count();
            $trainScore = $totalTrainings > 0 ? ($attended / $totalTrainings) * 100 : 0;

            $total = ($perfAvg * ($params['performance'] ?? 0) / 100) +
                     ($leadScore * ($params['leadership'] ?? 0) / 100) +
                     ($trainScore * ($params['training'] ?? 0) / 100);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'performance' => round($perfAvg, 1),
                'leadership' => round($leadScore, 1),
                'training' => round($trainScore, 1),
                'total' => round($total, 1)
            ];
        })->sortByDesc('total')->values();
    }
}
