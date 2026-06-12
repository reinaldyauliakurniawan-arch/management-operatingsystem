<?php

namespace App\Modules\IDS\Actions;

use App\Modules\IDS\Models\Issue;

class CreateIssue
{
    public function execute(array $data): Issue
    {
        return Issue::create($data);
    }
}
