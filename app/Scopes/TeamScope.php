<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TeamScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $teamId = session('active_team_id');
        if ($teamId) {
            $builder->where($model->getTable() . '.team_id', $teamId);
        }
    }
}
