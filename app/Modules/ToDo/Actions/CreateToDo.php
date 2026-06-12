<?php

namespace App\Modules\ToDo\Actions;

use App\Modules\ToDo\Models\ToDo;

class CreateToDo
{
    public function execute(array $data): ToDo
    {
        return ToDo::create($data);
    }
}
