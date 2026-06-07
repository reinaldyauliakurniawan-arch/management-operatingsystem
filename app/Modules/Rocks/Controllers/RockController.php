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
        $rocks = Rock::with('owner')->latest()->get();
        $users = User::all(['id', 'name']);

        return Inertia::render('Rocks/Index', [
            'rocks' => RockResource::collection($rocks),
            'users' => $users,
        ]);
    }

    public function store(CreateRockRequest $request, CreateRock $createRock)
    {
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
        $rock->delete();
        return back()->with('message', 'Rock deleted');
    }
}
