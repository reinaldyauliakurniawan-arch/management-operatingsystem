<?php

namespace App\Modules\Rocks\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'owner'       => [
                'id'   => $this->owner->id,
                'name' => $this->owner->name,
            ],
            'quarter'     => $this->quarter,
            'year'        => $this->year,
            'due_date'    => $this->due_date?->format('Y-m-d'),
            'status'      => $this->status,
            'milestones'  => $this->whenLoaded('milestones', fn() =>
                $this->milestones->map(fn($m) => [
                    'id'         => $m->id,
                    'title'      => $m->title,
                    'due_date'   => $m->due_date?->format('Y-m-d'),
                    'is_done'    => $m->is_done,
                    'sort_order' => $m->sort_order,
                ])
            ),
        ];
    }
}
