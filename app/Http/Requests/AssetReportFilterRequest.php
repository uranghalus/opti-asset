<?php

namespace App\Http\Requests;

use App\Services\AssetReportExporter;
use App\Services\AssetReportQuery;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Validator;

/**
 * Validasi filter Laporan Daftar Aset.
 *
 * Nama field sengaja identik dengan form Create (asset-form.tsx).
 * Semua opsional; nilai kosong dinormalisasi menjadi null di filters().
 */

class AssetReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(ValidatorContract $validator)
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // Kontrol halaman
            'format' => ['sometimes', 'in:xlsx,pdf'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'string', 'in:'.implode(',', AssetReportQuery::SORTABLE)],
            'direction' => ['sometimes', 'in:asc,desc'],
            'page' => ['sometimes', 'integer', 'min:1'],

            // Export: kolom terpilih (minimal satu)
            'columns' => ['sometimes', 'array'],
            'columns.*' => ['string', 'in:'.implode(',', AssetReportExporter::columnKeys())],

            // Teks (contains)
            'kode_asset' => ['sometimes', 'nullable', 'string', 'max:100'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:100'],
            'model' => ['sometimes', 'nullable', 'string', 'max:100'],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'part_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'vendor_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'no_spb' => ['sometimes', 'nullable', 'string', 'max:100'],
            'document_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'type_override_reason' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],

            // Exact
            'item_id' => ['sometimes', 'nullable', 'string', 'max:36'],
            'location_id' => ['sometimes', 'nullable', 'string', 'max:36'],
            'department_id' => ['sometimes', 'nullable', 'string', 'max:36'],
            'asset_type' => ['sometimes', 'nullable', 'in:fixed_asset,equipment'],
            'depreciation_method' => ['sometimes', 'nullable', 'in:straight_line,declining_balance,none'],
            'status' => ['sometimes', 'nullable', 'in:ACT,LOAN,RPR,MUT,DSP'],
            'condition' => ['sometimes', 'nullable', 'in:Baik,Rusak Ringan,Rusak Berat'],

            // Ada/tidak ada
            'has_photo' => ['sometimes', 'nullable', 'in:yes,no'],
            'has_document' => ['sometimes', 'nullable', 'in:yes,no'],
            'has_type_override' => ['sometimes', 'nullable', 'in:yes,no'],

            // PIC multi
            'pic' => ['sometimes', 'array'],
            'pic.*' => ['string', 'max:100'],

            // Rentang tanggal
            'purchase_date_from' => ['sometimes', 'nullable', 'date'],
            'purchase_date_to' => ['sometimes', 'nullable', 'date'],
            'in_come_date_from' => ['sometimes', 'nullable', 'date'],
            'in_come_date_to' => ['sometimes', 'nullable', 'date'],
            'warranty_expire_from' => ['sometimes', 'nullable', 'date'],
            'warranty_expire_to' => ['sometimes', 'nullable', 'date'],
            'garansi_exp_from' => ['sometimes', 'nullable', 'date'],
            'garansi_exp_to' => ['sometimes', 'nullable', 'date'],
            'broken_date_from' => ['sometimes', 'nullable', 'date'],
            'broken_date_to' => ['sometimes', 'nullable', 'date'],

            // Rentang angka
            'purchase_price_min' => ['sometimes', 'nullable', 'numeric'],
            'purchase_price_max' => ['sometimes', 'nullable', 'numeric'],
            'acquisition_cost_min' => ['sometimes', 'nullable', 'numeric'],
            'acquisition_cost_max' => ['sometimes', 'nullable', 'numeric'],
            'accumulated_depreciation_min' => ['sometimes', 'nullable', 'numeric'],
            'accumulated_depreciation_max' => ['sometimes', 'nullable', 'numeric'],
            'useful_life_years_min' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'useful_life_years_max' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Validasi silang rentang: hanya jika kedua ujung terisi.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->checkRange($validator, 'purchase_date');
            $this->checkRange($validator, 'in_come_date');
            $this->checkRange($validator, 'warranty_expire');
            $this->checkRange($validator, 'garansi_exp');
            $this->checkRange($validator, 'broken_date');

            $this->checkRange($validator, 'purchase_price');
            $this->checkRange($validator, 'acquisition_cost');
            $this->checkRange($validator, 'accumulated_depreciation');
            $this->checkRange($validator, 'useful_life_years');
        });
    }

    private function checkRange(Validator $validator, string $base): void
    {
        $fromKey = "{$base}_from";
        $toKey = "{$base}_to";

        // Angka memakai _min/_max.
        if ($this->has($fromKey) === false && $this->has("{$base}_min")) {
            $fromKey = "{$base}_min";
            $toKey = "{$base}_max";
        }

        $from = $this->input($fromKey);
        $to = $this->input($toKey);

        if ($from === null || $from === '' || $to === null || $to === '') {
            return;
        }

        $isDate = str_ends_with($fromKey, '_from');

        if ($isDate) {
            if (strtotime((string) $to) < strtotime((string) $from)) {
                $validator->errors()->add($toKey, 'Tanggal akhir tidak boleh lebih awal dari tanggal awal.');
            }

            return;
        }

        if ((float) $to < (float) $from) {
            $validator->errors()->add($toKey, 'Nilai maksimum tidak boleh lebih kecil dari nilai minimum.');
        }
    }

    /**
     * Filter terpakai: hanya nilai terisi, tanpa null/string kosong/array kosong.
     *
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $data = $this->safe()->except(['format', 'columns', 'page']);

        return array_filter(
            $data,
            static function ($value): bool {
                if ($value === null || $value === '') {
                    return false;
                }

                if (is_array($value) && $value === []) {
                    return false;
                }

                return true;
            },
        );
    }

    public function perPage(): int
    {
        return (int) ($this->input('per_page') ?? 25);
    }

    public function sortColumn(): string
    {
        $column = (string) ($this->input('sort') ?? 'created_at');

        return in_array($column, AssetReportQuery::SORTABLE, true) ? $column : 'created_at';
    }

    public function sortDirection(): string
    {
        return strtolower((string) ($this->input('direction') ?? 'desc')) === 'asc' ? 'asc' : 'desc';
    }

    public function exportFormat(): string
    {
        return (string) ($this->input('format') ?? 'xlsx');
    }

    /**
     * Key kolom terpilih (urut kanonik). Kosong jika tidak dikirim.
     *
     * @return array<int, string>
     */
    public function columns(): array
    {
        /** @var array<int, string> $columns */
        $columns = $this->input('columns', []);

        return AssetReportExporter::normalizeColumns($columns);
    }
}
