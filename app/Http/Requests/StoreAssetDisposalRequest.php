<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetDisposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => ['required', 'exists:assets,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'disposal_date' => ['nullable', 'date'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'status' => 'pending',
        ]);
    }
}
