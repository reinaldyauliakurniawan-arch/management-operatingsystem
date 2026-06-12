<?php

namespace App\Modules\LeadershipAssessment\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\AssessmentAssignment;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
use App\Modules\Teams\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeadershipAssessmentController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader') abort(403, 'Hanya leader.');
    }

    public function index()
    {
        $teamId = session('active_team_id');
        $userId = Auth::id();

        $cycles = AssessmentCycle::where('team_id', $teamId)->latest()->get();

        // Cycles where current user is assessor dan belum submit semua
        $pendingAssessments = AssessmentCycle::where('team_id', $teamId)
            ->where('status', 'open')
            ->whereHas('assignments', fn($q) => $q->where('user_id', '!=', $userId))
            ->get()
            ->filter(function ($cycle) use ($userId) {
                $assigning = $cycle->assignments->where('user_id', '!=', $userId);
                foreach ($assigning as $assignment) {
                    $submitted = AssessmentResponse::where('cycle_id', $cycle->id)
                        ->where('assessor_id', $userId)
                        ->where('assessee_id', $assignment->user_id)
                        ->count();
                    if ($submitted === 0) return true;
                }
                return false;
            });

        $leadershipTypes = LeadershipType::with('items.rubrics')->get();

        $users = User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))
            ->get(['id', 'name']);

        return Inertia::render('LeadershipAssessment/Index', [
            'cycles'             => $cycles,
            'pendingAssessments' => $pendingAssessments->values(),
            'leadershipTypes'    => $leadershipTypes,
            'users'              => $users,
        ]);
    }

    public function storeCycle(Request $request)
    {
        $this->requireLeader();
        $teamId = session('active_team_id');

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'periode_start' => 'nullable|date',
            'periode_end'   => 'nullable|date|after_or_equal:periode_start',
        ]);

        AssessmentCycle::create([
            ...$validated,
            'team_id'    => $teamId,
            'status'     => 'open',
            'created_by' => Auth::id(),
        ]);

        return back()->with('message', 'Cycle dibuat.');
    }

    public function assignAssessee(Request $request, AssessmentCycle $cycle)
    {
        $this->requireLeader();

        $validated = $request->validate([
            'assessee_id'         => 'required|exists:users,id',
            'leadership_type_ids' => 'required|array|min:1',
            'leadership_type_ids.*' => 'exists:leadership_types,id',
        ]);

        foreach ($validated['leadership_type_ids'] as $typeId) {
            AssessmentAssignment::firstOrCreate([
                'cycle_id'           => $cycle->id,
                'user_id'            => $validated['assessee_id'],
                'leadership_type_id' => $typeId,
            ]);
        }

        return back()->with('message', 'Assessee ditambahkan.');
    }

    public function closeCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();
        $cycle->update(['status' => 'closed']);
        return back()->with('message', 'Cycle ditutup.');
    }

    public function destroyCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();

        if (!$cycle->canBeDeleted()) {
            abort(422, 'Cycle tidak bisa dihapus — sudah ada submission.');
        }

        $cycle->delete();
        return back()->with('message', 'Cycle dihapus.');
    }

    public function takeAssessment(AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();

        // Pastikan assessee berbeda dari assessor
        if ($assessee->id === $userId) abort(403, 'Tidak bisa menilai diri sendiri.');

        // Pastikan cycle masih open
        if ($cycle->isClosed()) abort(403, 'Cycle sudah ditutup.');

        $assignments = AssessmentAssignment::where('cycle_id', $cycle->id)
            ->where('user_id', $assessee->id)
            ->with('leadershipType.items.rubrics')
            ->get();

        $existingResponses = AssessmentResponse::where('cycle_id', $cycle->id)
            ->where('assessor_id', $userId)
            ->where('assessee_id', $assessee->id)
            ->get()
            ->keyBy('item_id');

        return Inertia::render('LeadershipAssessment/TakeAssessment', [
            'cycle'             => $cycle,
            'assessee'          => $assessee,
            'assignments'       => $assignments,
            'existingResponses' => $existingResponses,
        ]);
    }

    public function submitResponse(Request $request, AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();

        if ($assessee->id === $userId) abort(403);
        if ($cycle->isClosed()) abort(403, 'Cycle sudah ditutup.');

        $validated = $request->validate([
            'responses'           => 'required|array',
            'responses.*.item_id' => 'required|exists:leadership_items,id',
            'responses.*.level'   => 'required|integer|between:1,5',
        ]);

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

        return back()->with('message', 'Penilaian disimpan.');
    }

    public function results(AssessmentCycle $cycle, User $assessee)
    {
        $userId = Auth::id();
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        // Assessee hanya bisa lihat hasil kalau cycle closed
        if ($assessee->id === $userId && !$cycle->isClosed()) {
            abort(403, 'Hasil baru tersedia setelah cycle ditutup.');
        }

        // Non-leader non-assessee tidak bisa lihat hasil orang lain
        if ($role !== 'leader' && $assessee->id !== $userId) {
            abort(403);
        }

        $responses = AssessmentResponse::where('cycle_id', $cycle->id)
            ->where('assessee_id', $assessee->id)
            ->with('item.leadershipType')
            ->get();

        // Group by leadership type
        $byType = $responses->groupBy(fn($r) => $r->item->leadership_type_id)
            ->map(fn($group) => [
                'type'     => $group->first()->item->leadershipType->name,
                'avg'      => round($group->avg('rubric_level'), 2),
                'count'    => $group->count(),
                'items'    => $group->map(fn($r) => [
                    'item'  => $r->item->title,
                    'level' => $r->rubric_level,
                ]),
            ])->values();

        return Inertia::render('LeadershipAssessment/Results', [
            'cycle'    => $cycle,
            'assessee' => $assessee,
            'byType'   => $byType,
            'overallAvg' => round($responses->avg('rubric_level'), 2),
        ]);
    }
}
