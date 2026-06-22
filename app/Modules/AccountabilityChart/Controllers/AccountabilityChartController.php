<?php

namespace App\Modules\AccountabilityChart\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AccountabilityChart\Actions\CreateSeat;
use App\Modules\AccountabilityChart\Actions\CreateUserAndAddToTeam;
use App\Modules\AccountabilityChart\Models\Seat;
use App\Modules\AccountabilityChart\Resources\SeatResource;
use App\Models\User;
use App\Modules\Teams\Models\Team;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountabilityChartController extends Controller
{
    private function requireLeader(): void
    {
        $teamId = TenantContext::teamId();
        $user   = Auth::user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');
        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) {
            abort(403, 'Hanya leader atau org admin yang bisa mengelola accountability chart.');
        }
    }

    public function index(Request $request)
    {
        return Inertia::render('AccountabilityChart/Index');
    }

    public function apiSeats(Request $request)
    {
        $orgId      = TenantContext::organizationId();
        $teamId     = TenantContext::teamId();
        $bigPicture = $request->boolean('big_picture');

        $withRelations = [
            'user',
            'children'                  => fn($q) => $q->withoutGlobalScopes(),
            'children.user',
            'children.children'         => fn($q) => $q->withoutGlobalScopes(),
            'children.children.user',
            'children.children.children' => fn($q) => $q->withoutGlobalScopes(),
            'children.children.children.user',
        ];

        $teamIds = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->pluck('id');

        $seats = Seat::withoutGlobalScopes()
            ->with($withRelations)
            ->whereIn('team_id', $teamIds)
            ->whereNull('parent_id')
            ->orderBy('id')
            ->get();

        return response()->json([
            'seats' => SeatResource::collection($seats)->resolve(),
        ]);
    }

    public function apiUsers(Request $request)
    {
        $orgId = TenantContext::organizationId();

        $teamIds = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->pluck('id');

        $users = User::whereHas('teamMemberships', fn($q) => $q->whereIn('team_id', $teamIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['users' => $users]);
    }

    public function store(
        Request $request,
        CreateSeat $createSeat,
        CreateUserAndAddToTeam $createUser,
    ) {
        $this->requireLeader();
        $teamId = TenantContext::teamId();

        if ($request->boolean('create_new_user')) {
            $validated = $request->validate([
                'new_user_name'    => 'required|string|max:255',
                'new_user_email'   => 'required|email|unique:users,email',
                'new_user_role'    => 'required|in:leader,member,tutor',
                'title'            => 'required|string|max:255',
                'parent_id'        => ['nullable', Rule::exists('seats', 'id')->where(fn($q) => $q->where('team_id', $teamId))],
                'responsibilities' => 'nullable|array',
            ]);

            $newUser = $createUser->execute([
                'name'  => $validated['new_user_name'],
                'email' => $validated['new_user_email'],
                'role'  => $validated['new_user_role'],
            ], $teamId);

            $createSeat->execute([
                'title'            => $validated['title'],
                'parent_id'        => $validated['parent_id'],
                'user_id'          => $newUser->id,
                'responsibilities' => $validated['responsibilities'],
            ]);

            return response()->json(['message' => 'User dan seat berhasil dibuat.']);
        }

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'parent_id'        => ['nullable', Rule::exists('seats', 'id')->where(fn($q) => $q->where('team_id', $teamId))],
            'user_id'          => 'nullable|exists:users,id',
            'responsibilities' => 'nullable|array',
        ]);

        $createSeat->execute($validated);

        return response()->json(['message' => 'Seat added']);
    }

    public function update(Request $request, int $seat)
    {
        $this->requireLeader();

        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);
        $orgId = TenantContext::organizationId();
        $orgTeamIds = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->pluck('id');
        abort_unless(
            $orgTeamIds->contains($seatModel->team_id),
            403,
            'Seat bukan milik organisasi aktif.'
        );

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'parent_id'        => ['nullable', Rule::exists('seats', 'id')->whereIn('team_id', $orgTeamIds)],
            'user_id'          => 'nullable|exists:users,id',
            'responsibilities' => 'nullable|array',
        ]);

        $seatModel->update($validated);

        return response()->json(['message' => 'Seat updated']);
    }

    public function generateFromTeams(Request $request)
    {
        $this->requireLeader();
        $orgId = TenantContext::organizationId();

        $teams = Team::withoutGlobalScopes()
            ->with(['members', 'members.user'])
            ->where('organization_id', $orgId)
            ->orderBy('parent_team_id')
            ->get();

        DB::transaction(function () use ($teams) {
            $teamToSeat = [];

            foreach ($teams as $team) {
                $existing = Seat::withoutGlobalScopes()
                    ->where('team_id', $team->id)
                    ->whereNull('parent_id')
                    ->first();
                if ($existing) {
                    $teamToSeat[$team->id] = $existing->id;
                    continue;
                }

                $leader       = $team->members->where('role', 'leader')->first();
                $parentSeatId = $team->parent_team_id ? ($teamToSeat[$team->parent_team_id] ?? null) : null;

                $teamSeat = Seat::create([
                    'team_id'          => $team->id,
                    'title'            => $team->name,
                    'user_id'          => $leader?->user_id ?? null,
                    'parent_id'        => $parentSeatId,
                    'responsibilities' => [],
                ]);

                $teamToSeat[$team->id] = $teamSeat->id;

                foreach ($team->members->where('role', '!=', 'leader') as $member) {
                    Seat::create([
                        'team_id'          => $team->id,
                        'title'            => '',
                        'user_id'          => $member->user_id,
                        'parent_id'        => $teamSeat->id,
                        'responsibilities' => [],
                    ]);
                }
            }
        });

        return response()->json(['message' => 'Chart berhasil di-generate dari data tim.']);
    }

    public function destroy(int $seat)
    {
        $this->requireLeader();

        // ponytail: fetch seat WITHOUT global scopes — the big-picture view
        // shows seats from all teams in the org, but TeamScope on route
        // model binding would filter by active_team_id only and 404.
        $seatModel = Seat::withoutGlobalScopes()->findOrFail($seat);

        // Verify the seat belongs to a team in the active org.
        $orgId = TenantContext::organizationId();
        $orgTeamIds = Team::withoutGlobalScopes()
            ->where('organization_id', $orgId)
            ->pluck('id');
        abort_unless(
            $orgTeamIds->contains($seatModel->team_id),
            403,
            'Seat bukan milik organisasi aktif.'
        );

        $seatTitle = $seatModel->title;
        $seatUserId = $seatModel->user_id;
        $seatModel->delete();

        activity('org-chart')
            ->causedBy(Auth::user())
            ->performedOn($seatModel)
            ->withProperties([
                'team_id' => $seatModel->team_id,
                'seat_title' => $seatTitle,
                'seat_user_id' => $seatUserId,
            ])
            ->log('Seat deleted from accountability chart');

        return response()->json(['message' => 'Seat deleted']);
    }
}
