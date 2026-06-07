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
        $todos = ToDo::with('owner')->orderBy('due_date')->get();
        $users = User::all(['id', 'name']);

        return Inertia::render('ToDo/Index', [
            'todos' => ToDoResource::collection($todos),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateToDo $createToDo)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'owner_id' => 'required|exists:users,id',
            'due_date' => 'required|date',
        ]);

        $createToDo->execute($validated);

        return back()->with('message', 'To-Do created');
    }

    public function toggle(ToDo $todo)
    {
        $todo->update(['is_completed' => !$todo->is_completed]);
        return back();
    }

    public function carryForward(CarryForwardToDos $carryForward)
    {
        $count = $carryForward->execute();
        return back()->with('message', "$count To-Dos carried forward");
    }

    public function destroy(ToDo $todo)
    {
        $todo->delete();
        return back();
    }
}
