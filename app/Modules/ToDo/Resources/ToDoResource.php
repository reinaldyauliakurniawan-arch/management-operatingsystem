<?php

namespace App\Modules\ToDo\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ToDoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'owner' => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ],
            'due_date' => $this->due_date->format('Y-m-d'),
            'is_completed' => $this->is_completed,
        ];
    }
}
