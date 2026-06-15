<?php

namespace App\Modules\AccountabilityChart\Actions;

use App\Models\User;
use App\Modules\Teams\Models\TeamMember;
use Illuminate\Support\Facades\Hash;

class CreateUserAndAddToTeam
{
    public function execute(array $data, int $teamId): User
    {
        $user = User::create([
            "name" => $data["name"],
            "email" => $data["email"],
            "password" => Hash::make("member123"),
        ]);

        TeamMember::create([
            "team_id" => $teamId,
            "user_id" => $user->id,
            "role" => $data["role"],
            "is_integrator" => false,
        ]);

        return $user;
    }
}
