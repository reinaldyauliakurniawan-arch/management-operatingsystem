<?php

namespace App\Traits;

use App\Scopes\TeamScope;
use Illuminate\Support\Facades\Auth;

trait HasTeam
{
    protected static function bootHasTeam()
    {
        static::addGlobalScope(new TeamScope);

        static::creating(function ($model) {
            if (! $model->team_id) {
                $model->team_id = session('active_team_id');
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
