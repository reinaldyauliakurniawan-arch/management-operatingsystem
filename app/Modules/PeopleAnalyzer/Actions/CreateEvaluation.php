<?php

namespace App\Modules\PeopleAnalyzer\Actions;

use App\Modules\PeopleAnalyzer\Models\Evaluation;
use Illuminate\Support\Facades\Auth;

class CreateEvaluation
{
    public function execute(array $data): Evaluation
    {
        return Evaluation::updateOrCreate(
            [
                'organization_id' => Auth::user()->organization_id,
                'user_id' => $data['user_id'],
            ],
            $data
        );
    }
}
