<?php

namespace App\Modules\PeopleAnalyzer\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'core_value_ratings' => $this->core_value_ratings ?? [],
            'gets_it' => $this->gets_it,
            'wants_it' => $this->wants_it,
            'capacity' => $this->capacity,
        ];
    }
}
