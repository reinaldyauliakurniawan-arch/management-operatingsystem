<?php

namespace App\Modules\IDS\Actions;

use App\Modules\IDS\Models\Issue;

class CreateIssue
{
    public function execute(array $data): Issue
    {
        $data['team_id']    = $data['team_id']    ?? session('active_team_id');
        $data['created_by'] = $data['created_by'] ?? auth()->id();
        return Issue::create($data);
    }
}
