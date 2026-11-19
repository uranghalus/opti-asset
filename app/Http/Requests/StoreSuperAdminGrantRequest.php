<?php

namespace App\Http\Requests;

use App\Models\User;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSuperAdminGrantRequest extends FormRequest
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
            'user_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $userId = $this->input('user_id');

            if (! is_numeric($userId)) {
                return;
            }

            $user = User::find($userId);

            if ($user !== null && $user->email === SuperAdminSeeder::EMAIL) {
                $validator->errors()->add(
                    'user_id',
                    'Pengguna super-admin bootstrap tidak dapat diberi hak super-admin ulang.',
                );
            }
        });
    }
}
