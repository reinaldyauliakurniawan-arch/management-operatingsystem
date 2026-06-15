<?php

namespace App\Modules\AccountabilityChart\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeatResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "title" => $this->title,
            "parent_id" => $this->parent_id,
            "team_id" => $this->team_id,
            "responsibilities" => $this->responsibilities ?? [],
            "user" => $this->user
                ? [
                    "id" => $this->user->id,
                    "name" => $this->user->name,
                ]
                : null,
            "children" => SeatResource::collection(
                $this->whenLoaded("children"),
            ),
        ];
    }
}
