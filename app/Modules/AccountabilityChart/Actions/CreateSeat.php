<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Modules\AccountabilityChart\Models\Seat;
use Illuminate\Support\Facades\Auth;

class CreateSeat
{
    public function execute(array $data): Seat
    {
        return Seat::create(array_merge($data, [
            'team_id' => Auth::user()->team_id,
        ]));
    }
}
