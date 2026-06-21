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
}
