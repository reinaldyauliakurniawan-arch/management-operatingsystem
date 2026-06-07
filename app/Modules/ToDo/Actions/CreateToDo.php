<?php

namespace App\Modules\ToDo\Actions;

use App\Modules\ToDo\Models\ToDo;
use Illuminate\Support\Facades\Auth;

class CreateToDo
{
    public function execute(array $data): ToDo
    {
        return ToDo::create(array_merge($data, [
            'organization_id' => Auth::user()->organization_id,
        ]));
    }
}
