<?php

namespace App\Modules\LeadershipAssessment\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\AssessmentAssignment;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
use App\Modules\LeadershipAssessment\Models\LeadershipItem;
use App\Modules\LeadershipAssessment\Models\LeadershipRubric;
use App\Modules\Teams\Models\TeamMember;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeadershipAssessmentController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->roleIn($teamId);
        if ($role !== 'leader' && !Auth::user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader.');
        }
    }

    private function teamMemberIds(int $teamId): \Illuminate\Support\Collection
    {
        return TeamMember::where('team_id', $teamId)->pluck('user_id');
    }

    private function countAssessorSubmissions(int $cycleId, int $assesseeId, int $leadershipTypeId, int $teamId): array
    {
        $type = LeadershipType::with('items')->find($leadershipTypeId);
        $itemIds = $type?->items->pluck('id') ?? collect();
        $requiredItems = $itemIds->count();

        if ($requiredItems === 0) {
            return ['submission_count' => 0, 'total_assessors' => 0];
        }

        $assessorIds = TeamMember::where('team_id', $teamId)
            ->where('user_id', '!=', $assesseeId)
            ->pluck('user_id');

        $submissionCount = $assessorIds->filter(function ($assessorId) use ($cycleId, $assesseeId, $itemIds, $requiredItems) {
            $answered = AssessmentResponse::where('cycle_id', $cycleId)
                ->where('assessor_id', $assessorId)
                ->where('assessee_id', $assesseeId)
                ->whereIn('item_id', $itemIds)
                ->count();

            return $answered >= $requiredItems;
        })->count();

        return [
            'submission_count' => $submissionCount,
            'total_assessors'  => $assessorIds->count(),
        ];
    }

    private function formatCycle(AssessmentCycle $cycle, int $teamId): array
    {
        $assignments = $cycle->assignments()
            ->with(['user:id,name', 'leadershipType:id,name'])
            ->get()
            ->map(function ($assignment) use ($cycle, $teamId) {
                $progress = $this->countAssessorSubmissions(
                    $cycle->id,
                    $assignment->user_id,
                    $assignment->leadership_type_id,
                    $teamId
                );

                return [
                    'id'                => $assignment->id,
                    'cycle_id'          => $cycle->id,
                    'user_id'           => $assignment->user_id,
                    'user'              => $assignment->user,
                    'type'              => $assignment->leadershipType,
                    'submission_count'  => $progress['submission_count'],
                    'total_assessors'   => $progress['total_assessors'],
                ];
            })
            ->values();

        $period = null;
        if ($cycle->periode_start || $cycle->periode_end) {
            $start = $cycle->periode_start?->format('d M Y');
            $end   = $cycle->periode_end?->format('d M Y');
            $period = trim(($start ?? '') . ($start && $end ? ' — ' : '') . ($end ?? ''));
        }

        return [
            'id'          => $cycle->id,
            'name'        => $cycle->name,
            'period'      => $period,
            'is_closed'   => $cycle->isClosed(),
            'assignments' => $assignments,
        ];
    }

    private function pendingForUser(int $teamId, int $userId): \Illuminate\Support\Collection
    {
        return AssessmentCycle::where('team_id', $teamId)
            ->where('status', 'open')
            ->with(['assignments.user:id,name', 'assignments.leadershipType.items'])
            ->get()
            ->flatMap(function ($cycle) use ($userId) {
                return $cycle->assignments
                    ->filter(fn ($a) => $a->user_id !== $userId)
                    ->filter(function ($assignment) use ($cycle, $userId) {
                        $itemIds = $assignment->leadershipType?->items->pluck('id') ?? collect();
                        if ($itemIds->isEmpty()) {
                            return false;
                        }

                        $answered = AssessmentResponse::where('cycle_id', $cycle->id)
                            ->where('assessor_id', $userId)
                            ->where('assessee_id', $assignment->user_id)
                            ->whereIn('item_id', $itemIds)
                            ->count();

                        return $answered < $itemIds->count();
                    })
                    ->map(fn ($assignment) => [
                        'id'       => $assignment->id,
                        'cycle_id' => $cycle->id,
                        'user_id'  => $assignment->user_id,
                        'user'     => $assignment->user,
                        'type'     => $assignment->leadershipType,
                    ]);
            })
            ->values();
    }

    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $userId = Auth::id();

        $cycles = AssessmentCycle::where('team_id', $teamId)
            ->latest()
            ->get()
            ->map(fn ($cycle) => $this->formatCycle($cycle, $teamId));

        // ponytail: LeadershipType now uses HasOrganization trait, so the
        // global scope automatically filters to the active org. No more
        // cross-tenant rubrik leakage.
        $leadershipTypes = LeadershipType::with('items.rubrics')->get();
        $users           = User::inTeam($teamId);

        return Inertia::render('LeadershipAssessment/Index', [
            'cycles'              => $cycles,
            'pendingAssignments'  => $this->pendingForUser($teamId, $userId),
            'types'               => $leadershipTypes,
            'users'               => $users,
        ]);
    }

    public function storeCycle(Request $request)
    {
        $this->requireLeader();
        $teamId = TenantContext::teamId();

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'period'        => 'nullable|string|max:255',
            'periode_start' => 'nullable|date',
            'periode_end'   => 'nullable|date|after_or_equal:periode_start',
        ]);

        AssessmentCycle::create([
            'name'          => $validated['name'],
            'periode_start' => $validated['periode_start'] ?? null,
            'periode_end'   => $validated['periode_end'] ?? null,
            'team_id'       => $teamId,
            'status'        => 'open',
            'created_by'    => Auth::id(),
        ]);

        return back()->with('message', 'Cycle dibuat.');
    }

    public function assignAssessee(Request $request, AssessmentCycle $cycle)
    {
        $this->requireLeader();
        $teamId = TenantContext::teamId();
        abort_unless($cycle->team_id === $teamId, 403, 'Cycle bukan milik team aktif.');

        if ($cycle->isClosed()) {
            abort(422, 'Cycle sudah ditutup.');
        }

        // ponytail: previously `assessee_id` was `required` but the frontend
        // (LeadershipAssessment/Index.tsx submitAssign) sends `user_id` only.
        // That mismatch silently failed every "Assign Assessment" click with
        // a 422 the user never saw — fixed by accepting either field.
        $validated = $request->validate([
            'assessee_id'           => 'nullable|exists:users,id',
            'user_id'               => 'nullable|exists:users,id',
            'leadership_type_id'    => 'nullable|exists:leadership_types,id',
            'leadership_type_ids'   => 'nullable|array|min:1',
            'leadership_type_ids.*' => 'exists:leadership_types,id',
        ]);

        $assesseeId = $validated['assessee_id'] ?? $validated['user_id'] ?? null;
        if (!$assesseeId) {
            abort(422, 'Assessee wajib dipilih.');
        }

        $isMember = TeamMember::where('team_id', $teamId)
            ->where('user_id', $assesseeId)
            ->exists();

        if (!$isMember) {
            abort(422, 'User bukan anggota team aktif.');
        }

        $typeIds = $validated['leadership_type_ids']
            ?? (isset($validated['leadership_type_id']) ? [$validated['leadership_type_id']] : []);

        if (empty($typeIds)) {
            abort(422, 'Tipe leadership wajib dipilih.');
        }

        foreach ($typeIds as $typeId) {
            AssessmentAssignment::firstOrCreate([
                'cycle_id'           => $cycle->id,
                'user_id'            => $assesseeId,
                'leadership_type_id' => $typeId,
            ]);
        }

        return back()->with('message', 'Assessee ditambahkan.');
    }

    public function updateCycle(Request $request, AssessmentCycle $cycle)
    {
        $this->requireLeader();
        abort_unless($cycle->team_id === TenantContext::teamId(), 403, 'Cycle bukan milik team aktif.');

        if ($cycle->isClosed()) {
            abort(422, 'Cycle sudah ditutup, tidak bisa diedit.');
        }

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'periode_start' => 'nullable|date',
            'periode_end'   => 'nullable|date|after_or_equal:periode_start',
        ]);

        $cycle->update($validated);

        return back()->with('message', 'Cycle diperbarui.');
    }

    public function closeCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();
        abort_unless($cycle->team_id === TenantContext::teamId(), 403, 'Cycle bukan milik team aktif.');
        $cycle->update(['status' => 'closed']);

        return back()->with('message', 'Cycle ditutup.');
    }

    public function destroyCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();
        abort_unless($cycle->team_id === TenantContext::teamId(), 403, 'Cycle bukan milik team aktif.');

        if (!$cycle->canBeDeleted()) {
            abort(422, 'Cycle tidak bisa dihapus — sudah ada submission.');
        }

        $cycle->delete();

        return back()->with('message', 'Cycle dihapus.');
    }

    public function takeAssessment(AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();
        $teamId = TenantContext::teamId();
        abort_unless($cycle->team_id === $teamId, 403, 'Cycle bukan milik team aktif.');

        if ($assessee->id === $userId) {
            abort(403, 'Tidak bisa menilai diri sendiri.');
        }

        if ($cycle->isClosed()) {
            abort(403, 'Cycle sudah ditutup.');
        }

        $isAssesseeMember = TeamMember::where('team_id', $teamId)
            ->where('user_id', $assessee->id)
            ->exists();

        if (!$isAssesseeMember) {
            abort(403, 'Assessee bukan anggota team.');
        }

        $assignments = AssessmentAssignment::where('cycle_id', $cycle->id)
            ->where('user_id', $assessee->id)
            ->with('leadershipType.items.rubrics')
            ->get();

        if ($assignments->isEmpty()) {
            abort(404, 'Tidak ada assignment untuk user ini.');
        }

        $existingResponses = AssessmentResponse::where('cycle_id', $cycle->id)
            ->where('assessor_id', $userId)
            ->where('assessee_id', $assessee->id)
            ->get()
            ->keyBy('item_id');

        return Inertia::render('LeadershipAssessment/TakeAssessment', [
            'cycle'             => $cycle->only(['id', 'name']),
            'assessee'          => $assessee->only(['id', 'name']),
            'assignments'       => $assignments,
            'existingResponses' => $existingResponses,
        ]);
    }

    public function submitResponse(Request $request, AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();
        $teamId = TenantContext::teamId();
        abort_unless($cycle->team_id === $teamId, 403, 'Cycle bukan milik team aktif.');

        if ($assessee->id === $userId) {
            abort(403);
        }
        if ($cycle->isClosed()) {
            abort(403, 'Cycle sudah ditutup.');
        }

        // ponytail: validate that every item_id belongs to a leadership type
        // assigned to this assessee in this cycle — prevents assessor from
        // submitting responses for items outside the assignment scope.
        $validated = $request->validate([
            'responses'           => 'required|array',
            'responses.*.item_id' => 'required|exists:leadership_items,id',
            'responses.*.level'   => 'required|integer|between:1,5',
        ]);

        $assignedTypeIds = AssessmentAssignment::where('cycle_id', $cycle->id)
            ->where('user_id', $assessee->id)
            ->pluck('leadership_type_id');

        $validItemIds = \App\Modules\LeadershipAssessment\Models\LeadershipItem::whereIn('leadership_type_id', $assignedTypeIds)
            ->pluck('id');

        $submittedItemIds = collect($validated['responses'])->pluck('item_id');
        $invalid = $submittedItemIds->diff($validItemIds);
        abort_if($invalid->isNotEmpty(), 422, 'Salah satu item tidak termasuk dalam assignment assessee.');

        DB::transaction(function () use ($validated, $cycle, $userId, $assessee) {
            foreach ($validated['responses'] as $r) {
                AssessmentResponse::updateOrCreate(
                    [
                        'cycle_id'    => $cycle->id,
                        'assessor_id' => $userId,
                        'assessee_id' => $assessee->id,
                        'item_id'     => $r['item_id'],
                    ],
                    ['rubric_level' => $r['level']]
                );
            }
        });

        return redirect()
            ->route('leadership-assessment.index')
            ->with('message', 'Penilaian disimpan.');
    }

    public function results(AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();
        $teamId = TenantContext::teamId();
        abort_unless($cycle->team_id === $teamId, 403, 'Cycle bukan milik team aktif.');
        $role   = Auth::user()->roleIn($teamId);

        if ($assessee->id === $userId && !$cycle->isClosed()) {
            abort(403, 'Hasil baru tersedia setelah cycle ditutup.');
        }

        if ($role !== 'leader' && $assessee->id !== $userId) {
            abort(403);
        }

        $responses = AssessmentResponse::where('cycle_id', $cycle->id)
            ->where('assessee_id', $assessee->id)
            ->with('item.leadershipType')
            ->get();

        $byType = $responses->groupBy(fn ($r) => $r->item->leadership_type_id)
            ->map(fn ($group) => [
                'type'  => $group->first()->item->leadershipType->name,
                'avg'   => round($group->avg('rubric_level'), 2),
                'count' => $group->count(),
                'items' => $group->map(fn ($r) => [
                    'item'  => $r->item->title,
                    'level' => $r->rubric_level,
                ])->values(),
            ])->values();

        return Inertia::render('LeadershipAssessment/Results', [
            'cycle'      => $cycle->only(['id', 'name', 'status']),
            'assessee'   => $assessee->only(['id', 'name']),
            'byType'     => $byType,
            'overallAvg' => $responses->isEmpty() ? null : round($responses->avg('rubric_level'), 2),
        ]);
    }

    // ---- Rubrik CRUD ----
    // ponytail: every rubrik route now requires the caller to be a leader or
    // org admin via the requireLeader() gate (was completely unprotected before).

    public function rubrikIndex()
    {
        $this->requireLeader();
        $types = LeadershipType::with('items.rubrics')->orderBy('id')->get();
        return Inertia::render('LeadershipAssessment/Rubrik', ['types' => $types]);
    }

    public function storeType(Request $request)
    {
        $this->requireLeader();
        $validated = $request->validate(['name' => 'required|string|max:255']);
        // ponytail: HasOrganization trait will inject org_id from session,
        // but we pass it explicitly to make the org scoping visible at the
        // call site (defense-in-depth).
        $validated['organization_id'] = TenantContext::organizationId();
        LeadershipType::create($validated);
        return back()->with('message', 'Tipe ditambahkan.');
    }

    public function updateType(Request $request, LeadershipType $type)
    {
        $this->requireLeader();
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $type->update($validated);
        return back()->with('message', 'Tipe diperbarui.');
    }

    public function destroyType(LeadershipType $type)
    {
        $this->requireLeader();
        // ponytail: audit log — rubrik changes affect all assessments that
        // use this type; deletion is destructive.
        $typeName = $type->name;
        $type->delete();

        activity('rubrik-admin')
            ->causedBy(Auth::user())
            ->performedOn($type)
            ->withProperties(['type_name' => $typeName])
            ->log('Deleted leadership type');

        return back()->with('message', 'Tipe dihapus.');
    }

    public function storeItem(Request $request, LeadershipType $type)
    {
        $this->requireLeader();
        $validated = $request->validate(['title' => 'required|string|max:255']);
        // ponytail: denormalize organization_id from parent type so we can
        // query items by org without joining.
        $validated['organization_id'] = $type->organization_id;
        $type->items()->create($validated);
        return back()->with('message', 'Item ditambahkan.');
    }

    public function updateItem(Request $request, LeadershipItem $item)
    {
        $this->requireLeader();
        $validated = $request->validate(['title' => 'required|string|max:255']);
        $item->update($validated);
        return back()->with('message', 'Item diperbarui.');
    }

    public function destroyItem(LeadershipItem $item)
    {
        $this->requireLeader();
        $item->delete();
        return back()->with('message', 'Item dihapus.');
    }

    public function storeRubric(Request $request, LeadershipItem $item)
    {
        $this->requireLeader();
        $validated = $request->validate([
            'level'       => 'required|integer|between:1,5',
            'description' => 'required|string',
        ]);
        // ponytail: denormalize organization_id from parent item.
        $validated['organization_id'] = $item->organization_id;
        LeadershipRubric::updateOrCreate(
            ['leadership_item_id' => $item->id, 'level' => $validated['level']],
            ['description' => $validated['description'], 'organization_id' => $validated['organization_id']]
        );
        return back()->with('message', 'Rubrik disimpan.');
    }

    public function updateRubric(Request $request, LeadershipRubric $rubric)
    {
        $this->requireLeader();
        $validated = $request->validate(['description' => 'required|string']);
        $rubric->update($validated);
        return back()->with('message', 'Rubrik diperbarui.');
    }

    public function destroyRubric(LeadershipRubric $rubric)
    {
        $this->requireLeader();
        $rubric->delete();
        return back()->with('message', 'Rubrik dihapus.');
    }
}
