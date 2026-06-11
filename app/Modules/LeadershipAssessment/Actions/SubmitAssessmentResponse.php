<?php
namespace App\Modules\LeadershipAssessment\Actions;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use Illuminate\Support\Facades\Auth;
class SubmitAssessmentResponse {
    public function execute(array $data): void {
        foreach ($data['responses'] as $itemId => $level) {
            AssessmentResponse::create([
                'cycle_id' => $data['cycle_id'],
                'assessor_id' => Auth::id(),
                'assessee_id' => $data['assessee_id'],
                'item_id' => $itemId,
                'rubric_level' => $level
            ]);
        }
    }
}
