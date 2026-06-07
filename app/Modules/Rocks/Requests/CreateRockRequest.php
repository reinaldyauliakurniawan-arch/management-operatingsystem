<?php

namespace App\Modules\Rocks\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'owner_id' => ['required', 'exists:users,id'],
            'quarter' => ['required', 'string'],
            'year' => ['required', 'integer'],
        ];
    }
}
