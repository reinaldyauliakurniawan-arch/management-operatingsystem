<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Organization\Actions\CreateOrganization;
use App\Modules\Organization\Requests\CreateOrganizationRequest;
use App\Modules\Organization\Resources\OrganizationResource;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function create()
    {
        return Inertia::render('Organization/Create');
    }

    public function store(CreateOrganizationRequest $request, CreateOrganization $createOrganization)
    {
        $organization = $createOrganization->execute($request->validated());

        return Redirect::route('dashboard');
    }
}
