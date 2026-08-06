<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function role(): Role
    {
        $role = $this->route('role');

        if (! $role instanceof Role) {
            throw new \RuntimeException('Peran tidak ditemukan.');
        }

        return $role;
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
                Rule::unique('roles', 'name')
                    ->ignore($this->role()->id)
                    ->where(fn ($query) => $query->where('guard_name', 'web')),
            ],
        ];
    }
}
