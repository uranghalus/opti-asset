<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:255', 'unique:tenants,id', 'alpha_dash'],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
