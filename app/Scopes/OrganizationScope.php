<?php

namespace App\Scopes;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $orgId = TenantContext::organizationId();

        // ponytail: fail closed in production web requests — silent no-op
        // lets CLI/migrations/seeders work but never leaks cross-tenant data
        // to a real HTTP request.
        if ($orgId === null) {
            if (app()->environment('production') && !app()->runningInConsole()) {
                throw new \RuntimeException(
                    "OrganizationScope cannot resolve organization_id for {$model->getMorphClass()}. "
                    . 'Use withoutGlobalScopes() explicitly for cross-tenant queries.'
                );
            }
            return;
        }

        $builder->where($model->getTable() . '.organization_id', $orgId);
    }
}
