<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;

class UpdateVTO
{
    public function execute(array $data): VTOPlan
    {
        $teamId = session('active_team_id');

        $vto = VTOPlan::withoutGlobalScopes()->firstOrCreate(
            ['team_id' => $teamId],
            ['team_id' => $teamId]
        );

        $vto->update(array_merge($data, ['updated_by' => auth()->id()]));

        return $vto;
    }
}
