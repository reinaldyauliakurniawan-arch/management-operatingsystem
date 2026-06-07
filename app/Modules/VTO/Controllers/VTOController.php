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
        $vto = VTOPlan::firstOrCreate([
            'organization_id' => Auth::user()->organization_id,
        ]);

        return Inertia::render('VTO/Index', [
            'vto' => new VTOResource($vto),
        ]);
    }

    public function update(UpdateVTORequest $request, UpdateVTO $updateVTO)
    {
        $updateVTO->execute($request->validated());

        return back()->with('message', 'VTO updated successfully');
    }
}
