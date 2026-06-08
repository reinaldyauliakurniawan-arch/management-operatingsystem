<?php

namespace App\Modules\Rocks\Actions;

use App\Modules\Rocks\Models\Rock;
use Illuminate\Support\Facades\Auth;

class CreateRock
{
    public function execute(array $data): Rock
    {
        return Rock::create(array_merge($data, [
            'team_id' => Auth::user()->team_id,
        ]));
    }
}
