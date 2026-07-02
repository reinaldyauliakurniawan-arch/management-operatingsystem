<?php

namespace App\Modules\Rocks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Rocks\Actions\CreateRock;
use App\Modules\Rocks\Actions\UpdateRockStatus;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Rocks\Requests\CreateRockRequest;
use App\Modules\Rocks\Resources\RockResource;
use App\Modules\Rocks\Models\RockQuarterTarget;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RockController extends Controller
{
    public function index(Request $request)
    {
        $teamId = TenantContext::teamId();
        $orgId  = TenantContext::organizationId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $team        = \App\Modules\Teams\Models\Team::withoutGlobalScopes()->find($teamId);
        $q1StartDate = $team?->q1_start_date
            ? \Carbon\Carbon::parse($team->q1_start_date)
            : \Carbon\Carbon::create(\Carbon\Carbon::now()->year, 1, 1);

        $now  = \Carbon\Carbon::now();
        $year = (int) $request->query('year', $now->year);

        // Auto-detect quarter aktif berdasarkan q1_start_date — sama pola dengan Scorecard
        $detectedQuarter = 1;
        for ($q = 4; $q >= 1; $q--) {
            $qs = $q1StartDate->copy()->addWeeks(($q - 1) * 13);
            $qe = $qs->copy()->addWeeks(13)->subDay();
            if ($now->between($qs, $qe)) {
                $detectedQuarter = $q;
                break;
            }
        }

        $quarterNum = (int) $request->query('quarter', $detectedQuarter);
        $quarterNum = max(1, min(4, $quarterNum));
        $quarterKey = 'Q' . $quarterNum;

        $rocks = Rock::with(['owner', 'milestones'])
            ->where('team_id', $teamId)
            ->where('quarter', $quarterKey)
            ->where('year', $year)
            ->latest()
            ->get();
        $users = User::inTeam($teamId);
        $qt    = RockQuarterTarget::where('team_id', $teamId)
            ->where('quarter', $quarterKey)
            ->where('year', $year)
            ->first();

        return Inertia::render('Rocks/Index', [
            'rocks' => RockResource::collection($rocks),
            'users' => $users,
            'filters' => [
                'quarter' => $quarterNum,
                'year'    => $year,
            ],
            'quarterTarget' => $qt ? [
                'quarter_date'        => $qt->quarter_date?->format('Y-m-d'),
                'quarter_revenue'     => $qt->quarter_revenue,
                'quarter_profit'      => $qt->quarter_profit,
                'quarter_measurables' => $qt->quarter_measurables,
            ] : null,
        ]);
    }

    public function updateQuarterTarget(Request $request)
    {
        $teamId = TenantContext::teamId();
        $role   = $request->user()->roleIn($teamId);
        abort_if($role !== 'leader', 403, 'Hanya leader yang bisa mengubah target quarter.');

        $validated = $request->validate([
            'quarter'             => 'required|integer|min:1|max:4',
            'year'                => 'required|integer',
            'quarter_date'        => 'nullable|date',
            'quarter_revenue'     => 'nullable|string|max:100',
            'quarter_profit'      => 'nullable|string|max:100',
            'quarter_measurables' => 'nullable|string|max:500',
        ]);

        RockQuarterTarget::updateOrCreate(
            [
                'team_id' => $teamId,
                'quarter' => 'Q' . $validated['quarter'],
                'year'    => $validated['year'],
            ],
            [
                'quarter_date'        => $validated['quarter_date'] ?? null,
                'quarter_revenue'     => $validated['quarter_revenue'] ?? null,
                'quarter_profit'      => $validated['quarter_profit'] ?? null,
                'quarter_measurables' => $validated['quarter_measurables'] ?? null,
                'updated_by'          => $request->user()->id,
            ],
        );

        return back()->with('message', 'Target quarter diperbarui.');
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
            'owner_id'    => ['sometimes', Rule::exists('users', 'id')->where(fn($q) => $q->whereExists(function ($sub) use ($teamId) {
                $sub->select(DB::raw(1))
                    ->from('team_members')
                    ->whereColumn('team_members.user_id', 'users.id')
                    ->where('team_members.team_id', $teamId)
                    ->whereNull('team_members.deleted_at');
            }))],
            'quarter'     => 'sometimes|string',
            'year'        => 'sometimes|integer',
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
