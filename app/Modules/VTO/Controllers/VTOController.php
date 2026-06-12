<?php

namespace App\Modules\VTO\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\VTO\Actions\UpdateVTO;
use App\Modules\VTO\Models\VTOPlan;
use App\Modules\VTO\Requests\UpdateVTORequest;
use App\Modules\VTO\Resources\VTOResource;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VTOController extends Controller
{
    public function index()
    {
        $teamId = session('active_team_id');

        // withoutGlobalScopes supaya firstOrCreate tidak terkena TeamScope
        // saat team_id di session belum ter-resolve dengan benar
        $vto = VTOPlan::withoutGlobalScopes()->firstOrCreate(
            ['team_id' => $teamId],
            ['team_id' => $teamId, 'created_by' => auth()->id()]
        );

        return Inertia::render('VTO/Index', [
            'vto'     => new VTOResource($vto),
            'canEdit' => auth()->user()->is_org_admin
                         || auth()->user()->teamMemberships()->where('team_id', $teamId)->value('role') === 'leader',
        ]);
    }

    public function update(UpdateVTORequest $request, UpdateVTO $updateVTO)
    {
        $teamId = session('active_team_id');
        $user   = $request->user();
        $role   = $user->teamMemberships()->where('team_id', $teamId)->value('role');

        if (!$user->is_org_admin && $role !== 'leader') {
            abort(403, 'Hanya org admin atau leader yang bisa mengubah VTO.');
        }

        $updateVTO->execute($request->validated());

        return back()->with('message', 'VTO diperbarui.');
    }
}
