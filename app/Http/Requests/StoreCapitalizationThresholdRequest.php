<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCapitalizationThresholdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999999'],
            'currency' => ['sometimes', 'string', 'size:3', Rule::in(['IDR', 'USD', 'EUR'])],
        ];
    }
}
