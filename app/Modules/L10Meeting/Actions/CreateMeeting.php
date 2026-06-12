<?php

namespace App\Modules\L10Meeting\Actions;

use App\Modules\L10Meeting\Models\Meeting;

class CreateMeeting
{
    public function execute(array $data): Meeting
    {
        $teamId = session('active_team_id');

        $meeting = Meeting::create([
            'team_id'      => $teamId,
            'type'         => $data['type'] ?? 'L10',
            'title'        => $data['title'] ?? null,
            'scheduled_at' => $data['scheduled_at'] ?? null,
            // Jika tidak ada scheduled_at, langsung mulai sekarang
            'started_at'   => isset($data['scheduled_at']) ? null : now(),
            'created_by'   => auth()->id(),
        ]);

        if (!empty($data['attendee_ids'])) {
            $meeting->attendees()->sync($data['attendee_ids']);
        }

        return $meeting;
    }
}
