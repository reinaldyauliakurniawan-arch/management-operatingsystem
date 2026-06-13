<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;

class UpdateVTO
{
    public function execute(array $data): VTOPlan
    {
        $orgId = session('active_organization_id');

        $vto = VTOPlan::withoutGlobalScopes()->firstOrCreate(
            ['organization_id' => $orgId],
            ['organization_id' => $orgId]
        );

        $vto->update(array_merge($data, ['updated_by' => auth()->id()]));

        return $vto;
    }
}
