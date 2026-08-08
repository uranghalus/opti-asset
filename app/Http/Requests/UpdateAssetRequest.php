<?php

namespace App\Http\Requests;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
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
            'item_id' => ['nullable', 'exists:items,id'],
            'condition' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'in_come_date' => ['nullable', 'date'],
            'broken_date' => ['nullable', 'date'],
            'warranty_expire' => ['nullable', 'date'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'department_id' => ['nullable', 'exists:tb_department,id_department'],
            'assigned_user_id' => ['nullable', 'string'],
            'assigned_status' => ['nullable', 'string', 'max:50'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'part_number' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100', Rule::unique('assets', 'serial_number')->ignore($this->route('asset')?->id)->where('tenant_id', Tenant::current()?->id)],
            'no_spb' => ['nullable', 'string', 'max:100'],
            'document_number' => ['nullable', 'string', 'max:100'],
            'pic' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'photo_url' => ['nullable', 'string'],
            'document_url' => ['nullable', 'string'],
            'garansi_exp' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'vendor_name' => ['nullable', 'string', 'max:100'],
            'asset_group_id' => ['nullable', 'exists:asset_groups,id'],
            'asset_category_id' => ['nullable', 'exists:asset_categories,id'],
            'asset_cluster_id' => ['nullable', 'exists:asset_clusters,id'],
            'asset_sub_cluster_id' => ['nullable', 'exists:asset_sub_clusters,id'],
        ];
    }
}
