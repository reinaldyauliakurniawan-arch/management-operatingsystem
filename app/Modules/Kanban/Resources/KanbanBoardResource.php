<?php

namespace App\Modules\Kanban\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class KanbanBoardResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'    => $this->id,
            'title' => $this->title,
            'columns' => $this->columns->map(fn($column) => [
                'id'         => $column->id,
                'title'      => $column->title,
                'sort_order' => $column->sort_order,
                'cards' => $column->cards->map(fn($card) => [
                    'id'                  => $card->id,
                    'title'               => $card->title,
                    'description'         => $card->description,
                    'responsible'         => $card->responsible,
                    'accountable'         => $card->accountable,
                    'consulted'           => $card->consulted,
                    'informed'            => $card->informed,
                    'definition_of_done'  => $card->definition_of_done,
                    'outcome'             => $card->outcome,
                    'due_date'            => $card->due_date?->format('Y-m-d'),
                    'sort_order'          => $card->sort_order,
                    'steps' => $card->steps->map(fn($step) => [
                        'id'         => $step->id,
                        'title'      => $step->title,
                        'is_done'    => $step->is_done,
                        'sort_order' => $step->sort_order,
                    ]),
                ]),
            ]),
        ];
    }
}
