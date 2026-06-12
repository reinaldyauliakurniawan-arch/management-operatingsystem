<?php

namespace App\Modules\ToDo\Actions;

use App\Modules\ToDo\Models\ToDo;

class CreateToDo
{
    public function execute(array $data): ToDo
    {
        $data['team_id']    = $data['team_id']    ?? session('active_team_id');
        $data['created_by'] = $data['created_by'] ?? auth()->id();
        return ToDo::create($data);
    }
}
