<?php

namespace App\Modules\ToDo\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ToDo\Actions\CreateToDo;
use App\Modules\ToDo\Actions\CarryForwardToDos;
use App\Modules\ToDo\Models\ToDo;
use App\Modules\ToDo\Resources\ToDoResource;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ToDoController extends Controller
{
    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $todos = ToDo::with(['owner', 'issue'])
            ->where('team_id', $teamId)
            ->orderBy('due_date')
            ->get();
        $users = User::inTeam($teamId);

        $openIssues = \App\Modules\IDS\Models\Issue::where('team_id', $teamId)
            ->where('status', 'open')
            ->orderBy('priority', 'desc')
            ->get(['id', 'title']);

        return Inertia::render('ToDo/Index', [
            'todos'        => ToDoResource::collection($todos),
            'users'        => $users,
            'open_issues'  => $openIssues,
        ]);
    }

    public function store(Request $request, CreateToDo $createToDo)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'owner_id'   => ['required', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'due_date'   => 'required|date',
            'meeting_id' => ['nullable', Rule::exists('meetings', 'id')->where('team_id', $teamId)],
            'issue_id'   => ['nullable', Rule::exists('issues', 'id')->where('team_id', $teamId)],
        ]);

        $validated['team_id']    = $teamId;
        $validated['created_by'] = $request->user()->id;
        $createToDo->execute($validated);

        return back()->with('message', 'To-Do dibuat.');
    }

    public function toggle(ToDo $todo)
    {
        $teamId = TenantContext::teamId();
        abort_unless($todo->team_id === $teamId, 403, 'To-Do bukan milik team aktif.');
        $user = request()->user();
        $role = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg() && $todo->owner_id !== $user->id) {
            abort(403, 'Kamu hanya bisa mengubah status to-do milikmu sendiri.');
        }

        $todo->update(['is_completed' => !$todo->is_completed]);

        return back();
    }

    public function carryForward(CarryForwardToDos $carryForward)
    {
        $teamId = TenantContext::teamId();
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa carry forward to-dos.');
        }

        $count = $carryForward->execute();
        return back()->with('message', "$count To-Dos carried forward");
    }

    public function destroy(ToDo $todo)
    {
        $teamId = TenantContext::teamId();
        abort_unless($todo->team_id === $teamId, 403, 'To-Do bukan milik team aktif.');
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg() && $todo->owner_id !== $user->id) {
            abort(403, 'Kamu hanya bisa menghapus to-do milikmu sendiri.');
        }

        $todo->delete();
        return back()->with('message', 'To-Do deleted');
    }
}
