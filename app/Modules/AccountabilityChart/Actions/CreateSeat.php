<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Modules\AccountabilityChart\Models\Seat;

class CreateSeat
{
    public function execute(array $data): Seat
    {
        return Seat::create($data);
    }
}
