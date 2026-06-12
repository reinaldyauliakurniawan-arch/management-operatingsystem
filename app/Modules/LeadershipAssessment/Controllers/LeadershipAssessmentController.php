<?php

namespace App\Modules\LeadershipAssessment\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LeadershipAssessment\Actions\StartAssessmentCycle;
use App\Modules\LeadershipAssessment\Actions\SubmitAssessmentResponse;
use App\Modules\LeadershipAssessment\Models\AssessmentCycle;
use App\Modules\LeadershipAssessment\Models\AssessmentAssignment;
use App\Modules\LeadershipAssessment\Models\AssessmentResponse;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeadershipAssessmentController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');
        $userId = Auth::id();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        $cycles = AssessmentCycle::where('team_id', $teamId)
            ->withCount('assignments')
            ->latest()
            ->get();

        // Cycles where current user has pending assessments (is an assessor)
        $pendingAssignments = collect();
        if ($role !== 'leader') {
            $pendingAssignments = AssessmentAssignment::whereHas('cycle', fn($q) =>
                    $q->where('team_id', $teamId)->where('status', 'open')
                )
                ->where('user_id', '!=', $userId) // assessee != assessor
                ->whereDoesntHave('responses', fn($q) => $q->where('assessor_id', $userId))
                ->with('cycle', 'leadershipType')
                ->get();
        }

        $leadershipTypes = LeadershipType::all();

        $teamMembers = TeamMember::with('user')
            ->where('team_id', $teamId)
            ->where('user_id', '!=', $userId)
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name, 'role' => $m->role]);

        return Inertia::render('LeadershipAssessment/Index', [
            'cycles'             => $cycles,
            'pendingAssignments' => $pendingAssignments,
            'leadershipTypes'    => $leadershipTypes,
            'teamMembers'        => $teamMembers,
            'userRole'           => $role,
        ]);
    }

    /**
     * Leader: buat cycle baru
     */
    public function storeCycle(Request $request, StartAssessmentCycle $action)
    {
        $this->requireLeader();
        $request->validate(['name' => 'required|string|max:255']);

        $action->execute($request->name, session('active_team_id'));

        return back()->with('message', 'Cycle dibuat.');
    }

    /**
     * Leader: assign assessee + leadership type ke cycle
     */
    public function storeAssignment(Request $request)
    {
        $this->requireLeader();

        $validated = $request->validate([
            'cycle_id'           => 'required|exists:assessment_cycles,id',
            'user_id'            => 'required|exists:users,id',
            'leadership_type_id' => 'required|exists:leadership_types,id',
        ]);

        // Prevent duplicate assignment
        AssessmentAssignment::firstOrCreate(
            [
                'cycle_id'           => $validated['cycle_id'],
                'user_id'            => $validated['user_id'],
                'leadership_type_id' => $validated['leadership_type_id'],
            ]
        );

        return back()->with('message', 'Assessee ditambahkan ke cycle.');
    }

    /**
     * Leader: tutup cycle (lock semua response)
     */
    public function closeCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();
        $cycle->update(['status' => 'closed']);
        return back()->with('message', 'Cycle ditutup.');
    }

    /**
     * Leader: update nama/periode cycle (hanya sebelum ada submission)
     */
    public function updateCycle(Request $request, AssessmentCycle $cycle)
    {
        $this->requireLeader();

        if ($cycle->status === 'closed') {
            abort(403, 'Cycle sudah ditutup, tidak bisa diubah.');
        }

        $validated = $request->validate(['name' => 'required|string|max:255']);
        $cycle->update($validated);
        return back()->with('message', 'Cycle diperbarui.');
    }

    /**
     * Leader: hapus cycle (hanya jika belum ada submission)
     */
    public function destroyCycle(AssessmentCycle $cycle)
    {
        $this->requireLeader();

        $hasResponses = AssessmentResponse::where('cycle_id', $cycle->id)->exists();
        if ($hasResponses) {
            abort(422, 'Cycle sudah memiliki submission, tidak bisa dihapus.');
        }

        $cycle->delete();
        return back()->with('message', 'Cycle dihapus.');
    }

    /**
     * Show assessment form for an assessor
     */
    public function show(AssessmentCycle $cycle, Request $request)
    {
        $userId   = Auth::id();
        $assesseeId = $request->query('assessee_id');

        abort_unless($cycle->status === 'open', 403, 'Cycle sudah ditutup.');

        // Load items for this cycle's assignment
        $assignment = AssessmentAssignment::where('cycle_id', $cycle->id)
            ->where('user_id', $assesseeId)
            ->with('leadershipType.items.rubrics')
            ->firstOrFail();

        // Existing responses by this assessor
        $existing = AssessmentResponse::where('cycle_id', $cycle->id)
            ->where('assessor_id', $userId)
            ->where('assessee_id', $assesseeId)
            ->pluck('rubric_level', 'item_id');

        return Inertia::render('LeadershipAssessment/TakeAssessment', [
            'cycle'      => $cycle,
            'assessee'   => \App\Models\User::find($assesseeId, ['id', 'name']),
            'assignment' => $assignment,
            'existing'   => $existing,
        ]);
    }

    /**
     * Assessor submit/update responses
     */
    public function submitResponse(Request $request, SubmitAssessmentResponse $action)
    {
        $validated = $request->validate([
            'cycle_id'    => 'required|exists:assessment_cycles,id',
            'assessee_id' => 'required|exists:users,id',
            'responses'   => 'required|array',
            'responses.*' => 'required|integer|min:1|max:5',
        ]);

        $cycle = AssessmentCycle::findOrFail($validated['cycle_id']);
        abort_unless($cycle->status === 'open', 403, 'Cycle sudah ditutup.');

        // Prevent self-assessment
        abort_if($validated['assessee_id'] == Auth::id(), 422, 'Tidak bisa menilai diri sendiri.');

        // Upsert responses
        foreach ($validated['responses'] as $itemId => $level) {
            AssessmentResponse::updateOrCreate(
                [
                    'cycle_id'    => $validated['cycle_id'],
                    'assessor_id' => Auth::id(),
                    'assessee_id' => $validated['assessee_id'],
                    'item_id'     => $itemId,
                ],
                ['rubric_level' => $level]
            );
        }

        return back()->with('message', 'Penilaian disimpan.');
    }

    /**
     * Result view: assessee lihat hasil setelah cycle closed, leader lihat semua
     */
    public function results(AssessmentCycle $cycle)
    {
        $teamId = session('active_team_id');
        $userId = Auth::id();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        abort_unless($cycle->status === 'closed' || $role === 'leader', 403, 'Hasil belum tersedia.');

        $assignments = AssessmentAssignment::where('cycle_id', $cycle->id)
            ->with('user:id,name', 'leadershipType.items')
            ->get();

        $results = $assignments->map(function ($assignment) use ($cycle, $role, $userId) {
            // Non-leader hanya bisa lihat result diri sendiri
            if ($role !== 'leader' && $assignment->user_id !== $userId) return null;

            $responses = AssessmentResponse::where('cycle_id', $cycle->id)
                ->where('assessee_id', $assignment->user_id)
                ->get();

            $itemScores = $responses->groupBy('item_id')->map(fn($group) => round($group->avg('rubric_level'), 2));

            return [
                'assessee'       => $assignment->user,
                'leadership_type' => $assignment->leadershipType->name,
                'avg_score'       => $itemScores->avg(),
                'item_scores'     => $itemScores,
            ];
        })->filter()->values();

        return Inertia::render('LeadershipAssessment/Results', [
            'cycle'   => $cycle,
            'results' => $results,
        ]);
    }

    private function requireLeader(): void
    {
        $teamId = session('active_team_id');
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader') abort(403, 'Hanya leader.');
    }
}
