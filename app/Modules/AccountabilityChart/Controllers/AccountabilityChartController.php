<?php

namespace App\Modules\AccountabilityChart\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AccountabilityChart\Actions\CreateSeat;
use App\Modules\AccountabilityChart\Models\Seat;
use App\Modules\AccountabilityChart\Resources\SeatResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountabilityChartController extends Controller
{
    public function index()
    {
        $seats = Seat::with('user', 'children')->orderBy('id')->get();
        $users = User::all(['id', 'name']);

        return Inertia::render('AccountabilityChart/Index', [
            'seats' => SeatResource::collection($seats),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateSeat $createSeat)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:seats,id',
            'user_id' => 'nullable|exists:users,id',
            'responsibilities' => 'nullable|array',
        ]);

        $createSeat->execute($validated);

        return back()->with('message', 'Seat added');
    }

    public function update(Request $request, Seat $seat)
    {
        $seat->update($request->all());
        return back();
    }

    public function destroy(Seat $seat)
    {
        $seat->delete();
        return back();
    }
}
