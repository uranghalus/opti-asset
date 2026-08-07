<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, Unique|string>>
     */
    public function rules(): array
    {
        return [
            'asset_group_id' => ['required', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_categories')->where(fn ($query) => $query->where('asset_group_id', $this->input('asset_group_id'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
