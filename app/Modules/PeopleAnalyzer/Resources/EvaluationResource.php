<?php

namespace App\Modules\PeopleAnalyzer\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'evaluatee'          => $this->evaluatee
                                    ? ['id' => $this->evaluatee->id, 'name' => $this->evaluatee->name]
                                    : null,
            'evaluator'          => $this->evaluator
                                    ? ['id' => $this->evaluator->id, 'name' => $this->evaluator->name]
                                    : null,
            'gwc_get'            => $this->gwc_get,
            'gwc_want'           => $this->gwc_want,
            'gwc_capacity'       => $this->gwc_capacity,
            'core_values_scores' => $this->core_values_scores ?? [],
            'period'             => $this->period,
            'seat_fit'           => $this->seat_fit,
            'seat_fit_label'     => $this->seatFitLabel(),
            'notes'              => $this->notes,
            'created_at'         => $this->created_at?->format('Y-m-d'),
        ];
    }

    private function seatFitLabel(): string
    {
        return match ($this->seat_fit) {
            'right_person_right_seat'  => 'Right Person, Right Seat',
            'wrong_person_right_seat'  => 'Wrong Person, Right Seat',
            'right_person_wrong_seat'  => 'Right Person, Wrong Seat',
            'wrong_person_wrong_seat'  => 'Wrong Person, Wrong Seat',
            default                    => 'Not Evaluated',
        };
    }
}
