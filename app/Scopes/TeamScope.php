<?php

namespace App\Scopes;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TeamScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $teamId = TenantContext::teamId();

        // ponytail: same fail-closed contract as OrganizationScope.
        if ($teamId === null) {
            if (app()->environment('production') && !app()->runningInConsole()) {
                throw new \RuntimeException(
                    "TeamScope cannot resolve team_id for {$model->getMorphClass()}. "
                    . 'Use withoutGlobalScopes() explicitly for cross-team queries.'
                );
            }
            return;
        }

        $builder->where($model->getTable() . '.team_id', $teamId);
    }
}
