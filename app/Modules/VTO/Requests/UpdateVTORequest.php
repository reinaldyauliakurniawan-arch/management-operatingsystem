<?php

namespace App\Modules\VTO\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVTORequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'core_values' => ['nullable', 'array'],
            'core_focus_purpose' => ['nullable', 'string'],
            'core_focus_niche' => ['nullable', 'string'],
            'ten_year_target' => ['nullable', 'string'],
            'target_market' => ['nullable', 'string'],
            'three_uniques' => ['nullable', 'string'],
            'proven_process' => ['nullable', 'string'],
            'guarantee' => ['nullable', 'string'],
            'three_year_date' => ['nullable', 'date'],
            'three_year_revenue' => ['nullable', 'string'],
            'three_year_profit' => ['nullable', 'string'],
            'three_year_measurables' => ['nullable', 'string'],
            'three_year_look' => ['nullable', 'array'],
            'one_year_date' => ['nullable', 'date'],
            'one_year_revenue' => ['nullable', 'string'],
            'one_year_profit' => ['nullable', 'string'],
            'one_year_measurables' => ['nullable', 'string'],
            'one_year_goals' => ['nullable', 'array'],
        ];
    }
}
