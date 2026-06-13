<?php

namespace App\Traits;

use App\Scopes\OrganizationScope;
use Illuminate\Support\Facades\Auth;

trait HasOrganization
{
    protected static function bootHasOrganization()
    {
        static::addGlobalScope(new OrganizationScope);

        static::creating(function ($model) {
            if (! $model->organization_id) {
                $model->organization_id = session('active_organization_id');
            }

            if (Auth::check()) {
                if (in_array('created_by', $model->getFillable())) {
                    $model->created_by = Auth::id();
                }
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                if (in_array('updated_by', $model->getFillable())) {
                    $model->updated_by = Auth::id();
                }
            }
        });
    }
}
