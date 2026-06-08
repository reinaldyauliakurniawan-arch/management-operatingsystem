<?php

namespace App\Modules\IDS\Actions;

use App\Modules\IDS\Models\Issue;
use Illuminate\Support\Facades\Auth;

class CreateIssue
{
    public function execute(array $data): Issue
    {
        return Issue::create(array_merge($data, [
            'team_id' => Auth::user()->team_id,
        ]));
    }
}
