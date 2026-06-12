<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;

class UpdateVTO
{
    public function execute(array $data): VTOPlan
    {
        $vto = VTOPlan::firstOrCreate([
            'team_id' => session('active_team_id'),
        ]);

        $vto->update($data);

        return $vto;
    }
}
