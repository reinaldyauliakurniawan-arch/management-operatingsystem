<?php
namespace App\Modules\LeadershipAssessment\Actions;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
class StartAssessmentCycle {
    public function execute(string $name, int $teamId): AssessmentCycle {
        return AssessmentCycle::create([
            'name'    => $name,
            'status'  => 'open',
            'team_id' => $teamId,
        ]);
    }
}
