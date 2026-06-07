<?php

namespace App\Modules\IDS\Actions;

use App\Modules\IDS\Models\Issue;
use Illuminate\Support\Facades\Auth;

class CreateIssue
{
    public function execute(array $data): Issue
    {
        return Issue::create(array_merge($data, [
            'organization_id' => Auth::user()->organization_id,
        ]));
    }
}
