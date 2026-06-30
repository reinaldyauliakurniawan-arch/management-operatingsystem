<?php

namespace App\Modules\IDS\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\IDS\Actions\CreateIssue;
use App\Modules\IDS\Models\Issue;
use App\Modules\IDS\Resources\IssueResource;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IDSController extends Controller
{
    public function index()
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $issues = Issue::with('owner')->withCount('todos')->where('team_id', $teamId)->orderBy('priority', 'desc')->get();
        $users = User::inTeam($teamId);

        return Inertia::render('IDS/Index', [
            'issues' => IssueResource::collection($issues),
            'users' => $users,
        ]);
    }

    public function store(Request $request, CreateIssue $createIssue)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'root_cause'  => 'nullable|string',
            'solution'    => 'nullable|string',
            'priority'    => 'nullable|integer|min:0|max:10',
            'owner_id'    => ['nullable', Rule::exists('users', 'id')->where(fn($q) => $q->whereExists(function ($sub) use ($teamId) {
                $sub->select(DB::raw(1))
                    ->from('team_members')
                    ->whereColumn('team_members.user_id', 'users.id')
                    ->where('team_members.team_id', $teamId)
                    ->whereNull('team_members.deleted_at');
            }))],
        ]);

        $validated['team_id']    = $teamId;
        $validated['priority']   = $validated['priority'] ?? 0;
        $validated['created_by'] = $request->user()->id;
        $createIssue->execute($validated);

        return back()->with('message', 'Issue dibuat.');
    }

    public function update(Request $request, Issue $issue)
    {
        $teamId = TenantContext::teamId();
        abort_unless($issue->team_id === $teamId, 403, 'Issue bukan milik team aktif.');
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if (!in_array($role, ['leader', 'member']) && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Tutor tidak bisa mengedit issue.');
        }

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'root_cause'  => 'nullable|string',
            'solution'    => 'nullable|string',
            'priority'    => 'sometimes|integer|min:0|max:10',
            'owner_id'    => ['nullable', Rule::exists('users', 'id')->where(fn($q) => $q->whereExists(function ($sub) use ($teamId) {
                $sub->select(DB::raw(1))
                    ->from('team_members')
                    ->whereColumn('team_members.user_id', 'users.id')
                    ->where('team_members.team_id', $teamId)
                    ->whereNull('team_members.deleted_at');
            }))],
        ]);

        $issue->update([...$validated, 'updated_by' => $user->id]);

        return back()->with('message', 'Issue diperbarui.');
    }

    public function resolve(Issue $issue)
    {
        $teamId = TenantContext::teamId();
        abort_unless($issue->team_id === $teamId, 403, 'Issue bukan milik team aktif.');
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if (!in_array($role, ['leader', 'member']) && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Tutor tidak bisa meresolve issue.');
        }

        $issue->update(['status' => 'resolved']);
        return back()->with('message', 'Issue resolved');
    }

    public function destroy(Issue $issue)
    {
        $teamId = TenantContext::teamId();
        abort_unless($issue->team_id === $teamId, 403, 'Issue bukan milik team aktif.');
        $user   = request()->user();
        $role   = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader yang bisa menghapus issue.');
        }

        $issue->delete();
        return back()->with('message', 'Issue deleted');
    }
}
