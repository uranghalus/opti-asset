<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function permission(): Permission
    {
        $permission = $this->route('permission');

        if (! $permission instanceof Permission) {
            throw new \RuntimeException('Izin tidak ditemukan.');
        }

        return $permission;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(\.[a-z0-9]+)+$/',
                Rule::unique('permissions', 'name')
                    ->ignore($this->permission()->id)
                    ->where(fn ($query) => $query->where('guard_name', 'web')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'Format izin harus berupa resource.tindakan, contoh: asset.location.view.',
        ];
    }
}
