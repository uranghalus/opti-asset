<?php

namespace App\Http\Requests;

use App\Enums\AssetTransferStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetTransferRequest extends FormRequest
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
            'asset_id' => ['required', 'exists:assets,id'],
            'from_location_id' => ['nullable', 'exists:locations,id'],
            'to_location_id' => ['nullable', 'exists:locations,id'],
            'from_department_id' => ['nullable', 'exists:tb_department,id_department'],
            'to_department_id' => ['nullable', 'exists:tb_department,id_department'],
            'from_user_id' => ['nullable', 'string'],
            'to_user_id' => ['nullable', 'string'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(AssetTransferStatus::class)],
        ];
    }
}
