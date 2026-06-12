<?php

namespace App\Modules\Scorecard\Actions;

use App\Modules\Scorecard\Models\Metric;

class CreateMetric
{
    public function execute(array $data): Metric
    {
        return Metric::create($data);
    }
}
