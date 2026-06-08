<?php

namespace App\Modules\Scorecard\Actions;

use App\Modules\Scorecard\Models\Metric;
use Illuminate\Support\Facades\Auth;

class CreateMetric
{
    public function execute(array $data): Metric
    {
        return Metric::create(array_merge($data, [
            'team_id' => Auth::user()->team_id,
        ]));
    }
}
