<?php

namespace App\Http\Requests;

use App\Models\AssetCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function category(): AssetCategory
    {
        $category = $this->route('category');

        if (! $category instanceof AssetCategory) {
            throw new \RuntimeException('Kategori tidak ditemukan.');
        }

        return $category;
    }

    /**
     * @return array<string, array<int, Unique|string>>
     */
    public function rules(): array
    {
        return [
            'asset_group_id' => ['required', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_categories')->ignore($this->category()->id)->where(fn ($query) => $query->where('asset_group_id', $this->input('asset_group_id'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
