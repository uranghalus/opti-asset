<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportAssetsRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:xlsx,csv,ods', 'max:5120'],
            'asset_group_id' => ['required', 'uuid', Rule::exists('asset_groups', 'id')],
            'asset_category_id' => ['required', 'uuid', Rule::exists('asset_categories', 'id')],
            'asset_cluster_id' => ['required', 'uuid', Rule::exists('asset_clusters', 'id')],
            'asset_sub_cluster_id' => ['required', 'uuid', Rule::exists('asset_sub_clusters', 'id')],
        ];
    }
}
