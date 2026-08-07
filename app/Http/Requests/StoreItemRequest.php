<?php

namespace App\Http\Requests;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:255', Rule::unique('items', 'code')->where('tenant_id', Tenant::current()?->id)],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:asset_categories,id'],
            'department_id' => ['nullable', 'exists:tb_department,id_department'],
            'description' => ['nullable', 'string'],
        ];
    }
}
