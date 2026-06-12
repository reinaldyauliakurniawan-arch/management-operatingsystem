<?php

namespace App\Modules\L10Meeting\Actions;

use App\Modules\L10Meeting\Models\Meeting;

class CreateMeeting
{
    public function execute(array $data): Meeting
    {
        $meeting = Meeting::create([
            'team_id' => session('active_team_id'),
            'type' => $data['type'] ?? 'L10',
            'started_at' => now(),
        ]);

        if (isset($data['attendee_ids'])) {
            $meeting->attendees()->sync($data['attendee_ids']);
        }

        return $meeting;
    }
}
