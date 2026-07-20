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
            'calendarEvents' => $this->calendarEvents->map(fn($event) => [
                'id'          => $event->id,
                'title'       => $event->title,
                'description' => $event->description,
                'responsible' => $event->responsible,
                'start_date'  => $event->start_date->format('Y-m-d'),
                'end_date'    => $event->end_date?->format('Y-m-d'),
            ]),
            'boardSeats' => $this->boardSeats->map(fn($seat) => [
                'id'               => $seat->id,
                'title'            => $seat->title,
                'parent_id'        => $seat->parent_id,
                'user'             => $seat->user ? ['id' => $seat->user->id, 'name' => $seat->user->name] : null,
                'responsibilities' => $seat->responsibilities ?? [],
            ]),
        ];
    }
}
