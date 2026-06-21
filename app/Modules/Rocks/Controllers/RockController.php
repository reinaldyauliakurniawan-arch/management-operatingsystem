<?php

namespace App\Modules\Rocks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Rocks\Actions\CreateRock;
use App\Modules\Rocks\Actions\UpdateRockStatus;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Rocks\Requests\CreateRockRequest;
use App\Modules\Rocks\Resources\RockResource;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RockController extends Controller
{
    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $rocks = Rock::with(['owner', 'milestones'])->where('team_id', $teamId)->latest()->get();
        $users = User::inTeam($teamId);

        return Inertia::render('Rocks/Index', [
            'rocks' => RockResource::collection($rocks),
            'users' => $users,
        ]);
    }

    public function store(CreateRockRequest $request, CreateRock $createRock)
    {
        $teamId = TenantContext::teamId();
        $role   = $request->user()->roleIn($teamId);

        if ($role !== 'leader' && !$request->user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa membuat Rock.');
        }

        $validated = $request->validated();
        // ponytail: scope owner_id to active team — prevent cross-tenant assignment.
        if (!empty($validated['owner_id'])) {
            $exists = User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))
                ->where('id', $validated['owner_id'])->exists();
            abort_unless($exists, 422, 'Owner bukan anggota team aktif.');
        }

        $createRock->execute(array_merge($validated, [
            'team_id'    => $teamId,
            'created_by' => $request->user()->id,
        ]));

        return back()->with('message', 'Rock created successfully');
    }

    public function updateStatus(Request $request, Rock $rock, UpdateRockStatus $updateRockStatus)
    {
        // FIX: hanya leader yang boleh update status rock (PRD: "leader update status")
        $teamId = TenantContext::teamId();
        $role = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa mengubah status Rock.');
        }

        $request->validate(['status' => 'required|in:on_track,off_track,done']);
        $updateRockStatus->execute($rock, $request->status);

        return back()->with('message', 'Rock status updated');
    }

    public function update(Request $request, Rock $rock)
    {
        $teamId = TenantContext::teamId();
        abort_unless($rock->team_id === $teamId, 403, 'Rock bukan milik team aktif.');
        $role   = $request->user()->roleIn($teamId);

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'owner_id'    => ['sometimes', Rule::exists('users', 'id')->where(fn($q) => $q->whereHas('teamMemberships', fn($q2) => $q2->where('team_id', $teamId)))],
            'due_date'    => 'nullable|date',
        ]);

        if ($role !== 'leader' && $rock->owner_id !== $request->user()->id) {
            abort(403);
        }

        // FIX: non-leader tidak boleh ubah owner_id (pindah tangan rock)
        if ($role !== 'leader') {
            unset($validated['owner_id']);
        }

        $rock->update([...$validated, 'updated_by' => $request->user()->id]);
        return back()->with('message', 'Rock diperbarui.');
    }

    public function storeMilestone(Request $request, Rock $rock)
    {
        // FIX: hanya owner rock atau leader yang boleh tambah milestone
        $teamId = TenantContext::teamId();
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader' && $rock->owner_id !== $request->user()->id) {
            abort(403, 'Hanya owner rock atau leader yang bisa menambah milestone.');
        }

        $validated = $request->validate([
            'title'      => 'required|string|max:255',
            'due_date'   => 'nullable|date',
            'sort_order' => 'nullable|integer',
        ]);

        $rock->milestones()->create($validated);
        return back()->with('message', 'Milestone ditambah.');
    }

    public function toggleMilestone(\App\Modules\Rocks\Models\RockMilestone $milestone)
    {
        // FIX: cek ownership via relasi rock, bukan implicit binding langsung ke milestone
        $teamId = TenantContext::teamId();
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');
        $rock   = $milestone->rock;

        // Pastikan milestone ini milik rock di team aktif
        if ($rock->team_id !== $teamId) {
            abort(403);
        }

        if ($role !== 'leader' && $rock->owner_id !== request()->user()->id) {
            abort(403, 'Hanya owner rock atau leader yang bisa mengubah milestone.');
        }

        $milestone->update(['is_done' => !$milestone->is_done]);
        return back()->with('message', 'Milestone diperbarui.');
    }

    public function destroyMilestone(\App\Modules\Rocks\Models\RockMilestone $milestone)
    {
        $teamId = TenantContext::teamId();
        $role   = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        // FIX: cek team ownership sebelum cek role
        if ($milestone->rock->team_id !== $teamId) {
            abort(403);
        }

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa menghapus milestone.');
        }

        $milestone->delete();
        return back()->with('message', 'Milestone dihapus.');
    }

    public function destroy(Rock $rock)
    {
        $teamId = TenantContext::teamId();
        $role = request()->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa menghapus Rock.');
        }

        $rock->delete();
        return back()->with('message', 'Rock deleted');
    }
}
