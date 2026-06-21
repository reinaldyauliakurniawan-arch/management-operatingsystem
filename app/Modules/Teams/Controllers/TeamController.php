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
        if (!Auth::user()->is_org_admin) {
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
            $user->is_org_admin = (bool) $validated['is_org_admin'];
            $user->save();
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
        DB::table('sessions')->where('user_id', $user->id)->delete();

        return back()->with('message', 'Password direset.');
    }

    public function destroyUser(User $user)
    {
        $this->requireOrgAdmin();
        abort_if($user->id === Auth::id(), 422, 'Tidak bisa menghapus akun sendiri.');

        // ponytail: invalidate sessions + soft-delete memberships to keep audit trail.
        DB::transaction(function () use ($user) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
            TeamMember::where('user_id', $user->id)->delete();
            $user->delete();
        });

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

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name'         => $validated['name'],
                'email'        => $validated['email'],
                'password'     => Hash::make($validated['password']),
                'is_org_admin' => $validated['is_org_admin'] ?? false,
            ]);

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
