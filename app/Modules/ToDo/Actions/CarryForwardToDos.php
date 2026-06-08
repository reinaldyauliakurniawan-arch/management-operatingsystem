<?php

namespace App\Modules\ToDo\Actions;

use App\Modules\ToDo\Models\ToDo;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class CarryForwardToDos
{
    public function execute(): int
    {
        $incomplete = ToDo::where('team_id', Auth::user()->team_id)
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
