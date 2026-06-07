<?php

namespace App\Modules\Rocks\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'owner' => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ],
            'quarter' => $this->quarter,
            'year' => $this->year,
            'status' => $this->status,
        ];
    }
}
