<?php

namespace App\Modules\Rocks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Rocks\Actions\CreateRock;
use App\Modules\Rocks\Actions\UpdateRockStatus;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Rocks\Requests\CreateRockRequest;
use App\Modules\Rocks\Resources\RockResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RockController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');
        $rocks = Rock::with('owner')->where('team_id', $teamId)->latest()->get();
        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        return Inertia::render('Rocks/Index', [
            'rocks' => RockResource::collection($rocks),
            'users' => $users,
        ]);
    }

    public function store(CreateRockRequest $request, CreateRock $createRock)
    {
        $teamId = session('active_team_id');
        $role = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat Rock.');
        }

        $createRock->execute($request->validated());

        return back()->with('message', 'Rock created successfully');
    }

    public function updateStatus(Request $request, Rock $rock, UpdateRockStatus $updateRockStatus)
    {
        $request->validate(['status' => 'required|string']);
        $updateRockStatus->execute($rock, $request->status);

        return back()->with('message', 'Rock status updated');
    }

    public function destroy(Rock $rock)
    {
        $teamId = session('active_team_id');
        $role = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa menghapus Rock.');
        }

        $rock->delete();
        return back()->with('message', 'Rock deleted');
    }
}
