<?php

namespace App\Modules\Organization\Actions;

use App\Models\Organization;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CreateOrganization
{
    public function execute(array $data): Organization
    {
        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'created_by' => Auth::id(),
        ]);

        Auth::user()->update([
            'organization_id' => $organization->id,
            'role' => 'admin',
        ]);

        return $organization;
    }
}
