<?php

namespace App\Modules\Rocks\Actions;

use App\Modules\Rocks\Models\Rock;

class CreateRock
{
    public function execute(array $data): Rock
    {
        return Rock::create($data);
    }
}
