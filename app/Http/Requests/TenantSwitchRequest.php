<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TenantSwitchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('tenant.switch');
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'tenant_id' => ['required', 'string', 'exists:tenants,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tenant_id.required' => 'Pilihan tenant wajib diisi.',
            'tenant_id.string' => 'ID tenant tidak valid.',
            'tenant_id.exists' => 'Tenant tidak ditemukan.',
        ];
    }
}
