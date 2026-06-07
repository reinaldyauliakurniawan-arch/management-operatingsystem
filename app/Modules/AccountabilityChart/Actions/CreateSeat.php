<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Modules\AccountabilityChart\Models\Seat;
use Illuminate\Support\Facades\Auth;

class CreateSeat
{
    public function execute(array $data): Seat
    {
        return Seat::create(array_merge($data, [
            'organization_id' => Auth::user()->organization_id,
        ]));
    }
}
