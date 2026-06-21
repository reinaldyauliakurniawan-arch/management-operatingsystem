<?php

namespace App\Modules\Teams\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    /**
     * List members of a team. Caller must be a member of that team OR an org admin.
     */
    public function index(Request $request)
    {
        $teamId = (int) $request->input('team_id', TenantContext::teamId());
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $team = Team::withoutGlobalScopes()->with('members.user')->findOrFail($teamId);

        // ponytail: enforce membership check — prevent IDOR across teams.
        $user = $request->user();
        $isMember = $user->isAdminOfActiveOrg()
            || TeamMember::where('team_id', $teamId)->where('user_id', $user->id)->exists();
        abort_unless($isMember, 403, 'Anda bukan anggota team ini.');

        $members = $team->members->map(fn($m) => [
            'id'            => $m->id,
            'user_id'       => $m->user_id,
            'name'          => $m->user->name,
            'email'         => $m->user->email,
            'role'          => $m->role,
            'is_integrator' => $m->is_integrator,
        ]);

        return response()->json(['members' => $members]);
    }

    public function store(Request $request)
    {
        $orgId = TenantContext::organizationId();

        $validated = $request->validate([
            'team_id'       => ['required', Rule::exists('teams', 'id')->where(fn($q) => $q->where('organization_id', $orgId))],
            'user_id'       => 'required|exists:users,id',
            'role'          => 'required|in:leader,member,tutor',
            'is_integrator' => 'boolean',
        ]);

        $teamId = $validated['team_id'];
        $user   = Auth::user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->isAdminOfActiveOrg() && $role !== 'leader') {
            abort(403, 'Hanya org admin atau leader yang bisa menambah anggota.');
        }

        $existing = TeamMember::where('team_id', $teamId)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($existing) {
            return back()->withErrors(['user_id' => 'User sudah menjadi anggota team ini.']);
        }

        TeamMember::create([
            'team_id'       => $validated['team_id'],
            'user_id'       => $validated['user_id'],
            'role'          => $validated['role'],
            'is_integrator' => $validated['is_integrator'] ?? false,
        ]);

        return back()->with('message', 'Anggota ditambahkan.');
    }

    public function update(Request $request, TeamMember $member)
    {
        $teamId = TenantContext::teamId();
        $user   = Auth::user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->isAdminOfActiveOrg() && $role !== 'leader') {
            abort(403);
        }

        abort_unless($member->team_id === $teamId, 403, 'Member bukan dari team aktif.');

        $validated = $request->validate([
            'role'          => 'required|in:leader,member,tutor',
            'is_integrator' => 'boolean',
        ]);

        $member->update($validated);

        // ponytail: role changed (e.g. leader demoted to member) — invalidate
        // target user's session so cached HandleInertiaRequests::teamRole refreshes.
        \App\Services\SessionInvalidator::forUser($member->user_id);

        return back()->with('message', 'Role diperbarui.');
    }

    public function destroy(TeamMember $member)
    {
        $teamId = TenantContext::teamId();
        $user   = Auth::user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->isAdminOfActiveOrg() && $role !== 'leader') {
            abort(403, 'Hanya org admin atau leader yang bisa mengeluarkan anggota.');
        }

        abort_unless($member->team_id === $teamId, 403, 'Member bukan dari team aktif.');
        abort_if($member->user_id === Auth::id(), 422, 'Tidak bisa mengeluarkan diri sendiri.');

        $member->delete();

        // ponytail: removed from team → session cache of userTeams is stale.
        \App\Services\SessionInvalidator::forUser($member->user_id);

        return back()->with('message', 'Anggota dikeluarkan dari team.');
    }
}
