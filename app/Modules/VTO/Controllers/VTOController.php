<?php

namespace App\Modules\VTO\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\VTO\Actions\UpdateVTO;
use App\Modules\VTO\Models\VTOPlan;
use App\Modules\VTO\Requests\UpdateVTORequest;
use App\Modules\VTO\Resources\VTOResource;
use App\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VTOController extends Controller
{
    public function index()
    {
        $teamId = TenantContext::teamId();
        $orgId  = TenantContext::organizationId();
        abort_if(!$orgId, 403, 'Tidak ada active organization.');

        // ponytail: lockForUpdate + transaction prevents the race where two
        // concurrent firstOrCreate calls each insert a VTOPlan row.
        $vto = DB::transaction(function () use ($orgId) {
            $vto = VTOPlan::withoutGlobalScopes()
                ->where('organization_id', $orgId)
                ->lockForUpdate()
                ->first();

            if (!$vto) {
                $vto = VTOPlan::withoutGlobalScopes()->create([
                    'organization_id' => $orgId,
                    'created_by'      => auth()->id(),
                ]);
            }

            return $vto;
        });

        return Inertia::render('VTO/Index', [
            'vto'     => VTOResource::make($vto)->resolve(),
            'canEdit' => auth()->user()->isAdminOfActiveOrg()
                         || auth()->user()->roleIn($teamId) === 'leader',
        ]);
    }

    public function update(UpdateVTORequest $request, UpdateVTO $updateVTO)
    {
        $teamId = TenantContext::teamId();
        $user   = $request->user();
        $role   = $user->roleIn($teamId);

        if (!$user->isAdminOfActiveOrg() && $role !== 'leader') {
            abort(403, 'Hanya org admin atau leader yang bisa mengubah VTO.');
        }

        $updateVTO->execute($request->validated());

        return redirect()->route('vto.index')->with('message', 'VTO diperbarui.');
    }
}
