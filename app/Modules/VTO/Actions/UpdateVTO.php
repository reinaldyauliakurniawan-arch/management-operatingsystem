<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;
use Illuminate\Support\Facades\Auth;

class UpdateVTO
{
    public function execute(array $data): VTOPlan
    {
        $vto = VTOPlan::firstOrCreate([
            'team_id' => Auth::user()->team_id,
        ]);

        $vto->update($data);

        return $vto;
    }
}
