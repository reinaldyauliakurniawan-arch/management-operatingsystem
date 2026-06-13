<?php

namespace App\Modules\Rocks\Actions;

use App\Modules\Rocks\Models\Rock;

class UpdateRockStatus
{
    public function execute(Rock $rock, string $status): Rock
    {
        $rock->update(['status' => $status]);
        return $rock;
    }
}
