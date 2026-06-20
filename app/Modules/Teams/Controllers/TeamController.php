<?php

namespace App\Modules\Teams\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeamController extends Controller
{
    private function requireOrgAdmin(): void
    {
        if (!Auth::user()->isAdminOfActiveOrg()) {
            abort(403, 'Hanya org admin yang bisa mengelola team.');
        }
    }

    /**
     * ponytail: scoped user list — never leak users outside the active org.
     */
    private function usersInActiveOrg(array $columns = ['id', 'name', 'email']): \Illuminate\Support\Collection
    {
        $orgId = TenantContext::organizationId();
        if ($orgId === null) {
            return collect();
        }

        $teamIds = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->pluck('id');

        return User::whereHas('teamMemberships', fn($q) => $q->whereIn('team_id', $teamIds))
            ->orderBy('name')
            ->get($columns);
    }

    public function index()
    {
        $orgId = TenantContext::organizationId();

        $teams = Team::withoutGlobalScopes()
            ->with(['members.user'])
            ->where('organization_id', $orgId)
            ->whereNull('deleted_at')
            ->get()
            ->map(fn($team) => [
                'id'             => $team->id,
                'name'           => $team->name,
                'type'           => $team->type,
                'parent_team_id' => $team->parent_team_id,
                'member_count'   => $team->members->count(),
                'leaders'        => $team->members
                    ->where('role', 'leader')
                    ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? ''])
                    ->values(),
                'next_event' => \App\Modules\Event\Models\Event::withoutGlobalScopes()
                    ->where('team_id', $team->id)
                    ->whereDate('event_date', '>=', now()->toDateString())
                    ->orderBy('event_date')
                    ->first(['name', 'type', 'event_date']),
            ]);

        $orgUsers = $this->usersInActiveOrg(['id', 'name', 'email', 'is_org_admin', 'created_at']);

        return Inertia::render('Teams/Index', [
            'teams'           => $teams,
            'allUsers'        => $orgUsers->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email]),
            'allSystemUsers'  => $orgUsers,
        ]);
    }

    public function users()
    {
        $this->requireOrgAdmin();
        return $this->index();
    }

    public function updateUser(Request $request, User $user)
    {
        $this->requireOrgAdmin();

        // ponytail: protect is_org_admin from mass-assignment — promote/demote
        // only via explicit field with org membership check.
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'is_org_admin'  => 'boolean',
        ]);

        // User must be a member of the active org to be modified by its admin.
        $orgId = TenantContext::organizationId();
        $isOrgMember = TeamMember::query()
            ->whereIn('team_id', Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id'))
            ->where('user_id', $user->id)
            ->exists();
        abort_unless($isOrgMember, 403, 'User bukan anggota organisasi aktif.');

        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (array_key_exists('is_org_admin', $validated)) {
            // ponytail: promote/demote via the per-org pivot (was global
            // is_org_admin column — closed C2 cross-tenant escalation).
            $wantAdmin = (bool) $validated['is_org_admin'];
            if ($wantAdmin) {
                $user->promoteToOrgAdmin($orgId);
            } else {
                $user->demoteFromOrgAdmin($orgId);
            }
            // ponytail: is_org_admin changed → invalidate target user's sessions
            // so the cached HandleInertiaRequests::isOrgAdmin gets refreshed.
            \App\Services\SessionInvalidator::forUser($user->id);

            // ponytail: audit log — promote/demote is a security-sensitive change.
            activity('admin-action')
                ->causedBy(Auth::user())
                ->performedOn($user)
                ->withProperties([
                    'organization_id' => $orgId,
                    'granted' => $wantAdmin,
                ])
                ->log($wantAdmin ? 'Promoted to org admin' : 'Demoted from org admin');
        }

        return back()->with('message', 'User diperbarui.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $this->requireOrgAdmin();
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        // ponytail: invalidate all sessions for the user after password reset.
        $user->update(['password' => Hash::make($validated['password'])]);
        \App\Services\SessionInvalidator::forUser($user->id);

        // ponytail: audit log — who reset whose password, when.
        activity('admin-action')
            ->causedBy(Auth::user())
            ->performedOn($user)
            ->withProperties(['target_email' => $user->email])
            ->log('Password reset for user');

        return back()->with('message', 'Password direset.');
    }

    public function destroyUser(User $user)
    {
        $this->requireOrgAdmin();
        abort_if($user->id === Auth::id(), 422, 'Tidak bisa menghapus akun sendiri.');

        // ponytail: invalidate sessions + soft-delete memberships to keep audit trail.
        DB::transaction(function () use ($user) {
            \App\Services\SessionInvalidator::forUser($user->id);
            TeamMember::where('user_id', $user->id)->delete();
            $user->delete();
        });

        // ponytail: audit log — account deletion is irreversible.
        activity('admin-action')
            ->causedBy(Auth::user())
            ->withProperties(['deleted_email' => $user->email])
            ->log('User account deleted');

        return back()->with('message', 'User dihapus.');
    }

    public function storeUser(Request $request)
    {
        $this->requireOrgAdmin();
        $orgId = TenantContext::organizationId();

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => ['required', 'email', Rule::unique('users', 'email')],
            'password'      => ['required', 'string', 'min:8', \Illuminate\Validation\Rules\Password::defaults()],
            'is_org_admin'  => 'boolean',
            'team_id'       => ['nullable', Rule::exists('teams', 'id')->where(fn($q) => $q->where('organization_id', $orgId))],
            'role'          => 'nullable|in:leader,member,tutor',
        ]);

        DB::transaction(function () use ($validated, $orgId) {
            $user = User::create([
                'name'         => $validated['name'],
                'email'        => $validated['email'],
                'password'     => Hash::make($validated['password']),
                // ponytail: legacy column kept as cache; actual admin grant
                // happens via promoteToOrgAdmin() below for the active org.
                'is_org_admin' => $validated['is_org_admin'] ?? false,
            ]);

            // ponytail: if caller wants admin, grant it via per-org pivot.
            if (!empty($validated['is_org_admin'])) {
                $user->promoteToOrgAdmin($orgId);
            }

            if (!empty($validated['team_id']) && !empty($validated['role'])) {
                TeamMember::create([
                    'team_id' => $validated['team_id'],
                    'user_id' => $user->id,
                    'role'    => $validated['role'],
                ]);
            }
        });

        return back()->with('message', 'User berhasil dibuat.');
    }

    public function store(Request $request)
    {
        $this->requireOrgAdmin();
        $orgId = TenantContext::organizationId();

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'type'            => 'required|in:leadership,departmental,project',
            'parent_team_id'  => ['nullable', Rule::exists('teams', 'id')->where(fn($q) => $q->where('organization_id', $orgId))],
            'leader_user_id'  => [
                'required',
                Rule::exists('users', 'id')->where(function ($q) use ($orgId) {
                    $q->whereHas('teamMemberships', fn($q2) => $q2->whereIn('team_id', Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id')));
                }),
            ],
        ]);

        DB::transaction(function () use ($validated, $orgId) {
            $team = Team::create([
                'organization_id' => $orgId,
                'name'            => $validated['name'],
                'type'            => $validated['type'],
                'parent_team_id'  => $validated['parent_team_id'] ?? null,
                'created_by'      => Auth::id(),
            ]);

            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $validated['leader_user_id'],
                'role'    => 'leader',
            ]);
        });

        return back()->with('message', 'Team dibuat.');
    }

    public function update(Request $request, Team $team)
    {
        $this->requireOrgAdmin();

        $orgId = TenantContext::organizationId();
        abort_unless($team->organization_id === $orgId, 403, 'Team bukan milik organisasi aktif.');

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'type'           => 'sometimes|in:leadership,departmental,project',
            'parent_team_id' => ['nullable', Rule::exists('teams', 'id')->where(fn($q) => $q->where('organization_id', $orgId))],
        ]);

        if (isset($validated['parent_team_id']) && $validated['parent_team_id'] === $team->id) {
            abort(422, 'Team tidak bisa menjadi parent dirinya sendiri.');
        }

        $team->update(array_merge($validated, ['updated_by' => Auth::id()]));

        return back()->with('message', 'Team diperbarui.');
    }

    public function assignLeader(Request $request, Team $team)
    {
        $this->requireOrgAdmin();
        $orgId = TenantContext::organizationId();
        abort_unless($team->organization_id === $orgId, 403, 'Team bukan milik organisasi aktif.');

        $validated = $request->validate([
            'user_id' => [
                'required',
                Rule::exists('users', 'id')->where(function ($q) use ($orgId) {
                    $q->whereHas('teamMemberships', fn($q2) => $q2->whereIn('team_id', Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id')));
                }),
            ],
        ]);

        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $validated['user_id'])
            ->first();

        if ($member) {
            $member->update(['role' => 'leader']);
        } else {
            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $validated['user_id'],
                'role'    => 'leader',
            ]);
        }

        // ponytail: new leader's session cache of teamRole needs refresh.
        \App\Services\SessionInvalidator::forUser((int) $validated['user_id']);

        return back()->with('message', 'Leader di-assign.');
    }

    public function destroy(int $team)
    {
        $this->requireOrgAdmin();
        $orgId = TenantContext::organizationId();

        $teamModel = Team::withoutGlobalScopes()->findOrFail($team);
        abort_unless($teamModel->organization_id === $orgId, 403, 'Team bukan milik organisasi aktif.');

        DB::transaction(function () use ($teamModel) {
            \App\Modules\AccountabilityChart\Models\Seat::withoutGlobalScopes()
                ->where('team_id', $teamModel->id)
                ->delete();
            $teamModel->delete();
        });

        if (session('active_team_id') === $teamModel->id) {
            session()->forget(['active_team_id', 'active_organization_id']);
        }

        return back()->with('message', 'Team dihapus.');
    }
}
