<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Models\User;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateUserAndAddToTeam
{
    /**
     * ponytail: generate a random 24-char password instead of the hardcoded
     * 'member123'. Caller is responsible for emailing a reset link so the
     * new user can pick their own password; we never persist a known default.
     */
    public function execute(array $data, int $teamId): User
    {
        $temporaryPassword = Str::random(24);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($temporaryPassword),
        ]);

        TeamMember::create([
            'team_id'       => $teamId,
            'user_id'       => $user->id,
            'role'          => $data['role'],
            'is_integrator' => false,
        ]);

        // Dispatch password reset link so the new user sets their own password.
        // ponytail: fire-and-forget — the broker returns a token we discard;
        // the user gets an email with a signed reset URL.
        $status = \Illuminate\Support\Facades\Password::sendResetLink(['email' => $user->email]);
        report("CreateUserAndAddToTeam: password reset link status={$status} for user_id={$user->id}");

        return $user;
    }
}
