<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Modules\AccountabilityChart\Models\Seat;
use Illuminate\Support\Facades\Auth;

class CreateSeat
{
    public function execute(array $data): Seat
    {
        $data['team_id']    = $data['team_id']    ?? session('active_team_id');
        $data['created_by'] = $data['created_by'] ?? Auth::id();
        return Seat::create($data);
    }
}
