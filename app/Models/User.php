<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Teams\Models\Team;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_org_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_org_admin'      => 'boolean',
        ];
    }

    public function teamMemberships()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot('role', 'is_integrator');
    }

    /**
     * ponytail: per-org membership pivot. A user can be admin of some orgs
     * and a regular member of others — replacing the global is_org_admin
     * flag that gave admin rights across ALL orgs the user touched.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    /**
     * ponytail: scoped user lookup — replaces the User::all() leak pattern.
     * Always filters by team membership so we never leak users from other tenants.
     */
    public static function inTeam(int $teamId, array $columns = ['id', 'name']): \Illuminate\Database\Eloquent\Collection
    {
        return static::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))
            ->orderBy('name')
            ->get($columns);
    }

    public function roleIn(int $teamId): ?string
    {
        return $this->teamMemberships()->where('team_id', $teamId)->value('role');
    }

    /**
     * ponytail: per-org admin check via pivot table. Replaces the global
     * is_org_admin flag for authorization decisions. The legacy column is
     * kept as a cache (true if user is admin of ANY org) for backwards
     * compatibility with code we haven't migrated yet.
     */
    public function isAdminOf(?int $organizationId): bool
    {
        if (!$organizationId) {
            return false;
        }
        return $this->organizations()
            ->wherePivot('organization_id', $organizationId)
            ->wherePivot('is_admin', true)
            ->exists();
    }

    /**
     * ponytail: convenience wrapper for the most common pattern — check
     * admin status for the active organization (from session).
     */
    public function isAdminOfActiveOrg(): bool
    {
        return $this->isAdminOf(\App\Services\TenantContext::organizationId());
    }

    /**
     * Promote this user to admin of the given org. Updates the pivot row,
     * also flips the legacy is_org_admin cache to true.
     */
    public function promoteToOrgAdmin(int $organizationId): void
    {
        \DB::table('organization_user')->updateOrInsert(
            ['organization_id' => $organizationId, 'user_id' => $this->id],
            ['is_admin' => true, 'updated_at' => now(), 'created_at' => now()],
        );
        if (!$this->is_org_admin) {
            $this->is_org_admin = true;
            $this->save();
        }
    }

    /**
     * Demote this user from admin of the given org. Does NOT touch the
     * legacy is_org_admin cache (it's recomputed lazily elsewhere if needed).
     */
    public function demoteFromOrgAdmin(int $organizationId): void
    {
        \DB::table('organization_user')
            ->where('organization_id', $organizationId)
            ->where('user_id', $this->id)
            ->update(['is_admin' => false, 'updated_at' => now()]);
    }
}
