<?php

namespace App\Modules\ToDo\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ToDo\Actions\CreateToDo;
use App\Modules\ToDo\Actions\CarryForwardToDos;
use App\Modules\ToDo\Models\ToDo;
use App\Modules\ToDo\Resources\ToDoResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ToDoController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');
        $todos = ToDo::with('owner')->where('team_id', $teamId)->orderBy('due_date')->get();
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        return Inertia::render('ToDo/Index', [
            'todos' => ToDoResource::collection($todos),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateToDo $createToDo)
    {
        $teamId = session('active_team_id');

        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'owner_id'   => 'required|exists:users,id',
            'due_date'   => 'required|date',
            'meeting_id' => 'nullable|exists:meetings,id',
        ]);

        $validated['team_id'] = $teamId;
        $createToDo->execute($validated);

        return back()->with('message', 'To-Do dibuat.');
    }

    public function toggle(ToDo $todo)
    {
        $teamId = session('active_team_id');
        $user   = request()->user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && $todo->owner_id !== $user->id) {
            abort(403, 'Kamu hanya bisa mengubah status to-do milikmu sendiri.');
        }

        $todo->update(['is_completed' => ! $todo->is_completed]);

        return back();
    }

    public function carryForward(CarryForwardToDos $carryForward)
    {
        $count = $carryForward->execute();
        return back()->with('message', "$count To-Dos carried forward");
    }

    public function destroy(ToDo $todo)
    {
        $teamId = session('active_team_id');
        $userId = request()->user()->id;
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && $todo->owner_id !== $userId) {
            abort(403, 'Kamu hanya bisa menghapus to-do milikmu sendiri.');
        }

        $todo->delete();
        return back()->with('message', 'To-Do deleted');
    }
}
