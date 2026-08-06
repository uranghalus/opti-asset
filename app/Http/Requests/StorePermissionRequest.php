<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
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
            'resource' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(\.[a-z0-9]+)*$/'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9]+$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resource.regex' => 'Nama grup harus huruf kecil, contoh: asset.location.',
            'actions.required' => 'Pilih minimal satu tindakan.',
            'actions.min' => 'Pilih minimal satu tindakan.',
            'actions.*.regex' => 'Tindakan harus huruf kecil tanpa spasi.',
        ];
    }
}
