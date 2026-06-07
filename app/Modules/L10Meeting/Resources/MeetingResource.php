<?php

namespace App\Modules\L10Meeting\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'started_at' => $this->started_at?->format('Y-m-d H:i:s'),
            'ended_at' => $this->ended_at?->format('Y-m-d H:i:s'),
            'rating' => $this->rating,
            'attendees' => $this->attendees->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
        ];
    }
}
