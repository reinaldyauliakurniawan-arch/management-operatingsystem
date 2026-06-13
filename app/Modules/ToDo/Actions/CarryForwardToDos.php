<?php

namespace App\Modules\ToDo\Actions;

use App\Modules\ToDo\Models\ToDo;
use Carbon\Carbon;

class CarryForwardToDos
{
    public function execute(): int
    {
        $incomplete = ToDo::where('team_id', session('active_team_id'))
            ->where('is_completed', false)
            ->where('due_date', '<', Carbon::today())
            ->get();

        foreach ($incomplete as $todo) {
            $todo->update([
                'due_date' => Carbon::today()->addDays(7), // Move to next week
            ]);
        }

        return $incomplete->count();
    }
}
