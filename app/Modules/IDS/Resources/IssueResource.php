<?php

namespace App\Modules\IDS\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'root_cause' => $this->root_cause,
            'solution' => $this->solution,
            'priority' => $this->priority,
            'status' => $this->status,
            'owner' => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null,
            'todo_count' => $this->todos_count ?? 0,
        ];
    }
}
