<?php

namespace App\Modules\VTO\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VTOResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'core_values' => $this->core_values ?? [],
            'core_focus_purpose' => $this->core_focus_purpose,
            'core_focus_niche' => $this->core_focus_niche,
            'ten_year_target' => $this->ten_year_target,
            'target_market' => $this->target_market,
            'three_uniques' => $this->three_uniques,
            'proven_process' => $this->proven_process,
            'guarantee' => $this->guarantee,
            'three_year_date' => $this->three_year_date?->format('Y-m-d'),
            'three_year_revenue' => $this->three_year_revenue,
            'three_year_profit' => $this->three_year_profit,
            'three_year_measurables' => $this->three_year_measurables,
            'three_year_look' => $this->three_year_look ?? [],
            'one_year_date' => $this->one_year_date?->format('Y-m-d'),
            'one_year_revenue' => $this->one_year_revenue,
            'one_year_profit' => $this->one_year_profit,
            'one_year_measurables' => $this->one_year_measurables,
            'one_year_goals' => $this->one_year_goals ?? [],
        ];
    }
}
