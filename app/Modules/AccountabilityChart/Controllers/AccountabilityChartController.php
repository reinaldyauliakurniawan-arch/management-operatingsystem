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
        $teamId = session('active_team_id');

        // Ambil semua seat team ini (HasTeam global scope sudah filter otomatis)
        // Tapi kita juga mau lihat parent chart (team_id null = org-level seat)
        $seats = Seat::withoutGlobalScopes()
            ->with(['user', 'children'])
            ->where(function ($q) use ($teamId) {
                $q->where('team_id', $teamId)
                  ->orWhereNull('team_id'); // org-level seats tetap tampil
            })
            ->orderBy('parent_id')
            ->orderBy('id')
            ->get();

        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        return Inertia::render('AccountabilityChart/Index', [
            'seats' => SeatResource::collection($seats),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateSeat $createSeat)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && !$request->user()->is_org_admin) {
            abort(403, 'Hanya leader atau org admin yang bisa menambah seat.');
        }

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'parent_id'        => 'nullable|exists:seats,id',
            'user_id'          => 'nullable|exists:users,id',
            'responsibilities' => 'nullable|array',
        ]);

        $createSeat->execute($validated);

        return back()->with('message', 'Seat added');
    }

    public function update(Request $request, Seat $seat)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && !$request->user()->is_org_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'parent_id'        => 'nullable|exists:seats,id',
            'user_id'          => 'nullable|exists:users,id',
            'responsibilities' => 'nullable|array',
        ]);

        $seat->update($validated);
        return back()->with('message', 'Seat updated');
    }

    public function destroy(Seat $seat)
    {
        $teamId = session('active_team_id');
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && !request()->user()->is_org_admin) {
            abort(403);
        }

        $seat->delete();
        return back()->with('message', 'Seat deleted');
    }
}
