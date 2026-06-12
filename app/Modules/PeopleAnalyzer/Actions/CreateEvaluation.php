<?php

namespace App\Modules\PeopleAnalyzer\Actions;

use App\Modules\PeopleAnalyzer\Models\Evaluation;

class CreateEvaluation
{
    public function execute(array $data): Evaluation
    {
        return Evaluation::updateOrCreate(
            [
                'team_id' => session('active_team_id'),
                'evaluatee_id' => $data['evaluatee_id'],
            ],
            $data
        );
    }
}
