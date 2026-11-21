<?php

namespace App\Services;

use App\Enums\AssetStatus;
use App\Models\Asset;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Export Laporan Daftar Aset ke XLSX / PDF.
 *
 * Katalog kolom kanonik di sini adalah sumber kebenaran key → label → resolver.
 * Frontend memakai key yang sama (resources/js/lib/asset-report-columns.ts).
 * Export HANYA memuat kolom yang dipilih user; urutan selalu mengikuti kanonik.
 */
class AssetReportExporter
{
    /**
     * Katalog kolom kanonik, urutan tetap.
     *
     * key => ['label' => string, 'align' => 'left'|'right'|'center']
     *
     * @var array<string, array{label: string, align: string}>
     */
    public const COLUMNS = [
        'kode_asset' => ['label' => 'Kode Aset', 'align' => 'left'],
        'item' => ['label' => 'Item', 'align' => 'left'],
        'brand' => ['label' => 'Brand', 'align' => 'left'],
        'model' => ['label' => 'Model', 'align' => 'left'],
        'serial_number' => ['label' => 'Serial Number', 'align' => 'left'],
        'part_number' => ['label' => 'Part Number', 'align' => 'left'],
        'purchase_date' => ['label' => 'Tanggal Pembelian', 'align' => 'left'],
        'purchase_price' => ['label' => 'Harga Pembelian', 'align' => 'right'],
        'vendor_name' => ['label' => 'Vendor', 'align' => 'left'],
        'location' => ['label' => 'Lokasi', 'align' => 'left'],
        'department' => ['label' => 'Department', 'align' => 'left'],
        'asset_type' => ['label' => 'Tipe Aset', 'align' => 'left'],
        'acquisition_cost' => ['label' => 'Nilai Perolehan', 'align' => 'right'],
        'useful_life_years' => ['label' => 'Masa Manfaat (Tahun)', 'align' => 'right'],
        'depreciation_method' => ['label' => 'Metode Penyusutan', 'align' => 'left'],
        'accumulated_depreciation' => ['label' => 'Akumulasi Penyusutan', 'align' => 'right'],
        'in_come_date' => ['label' => 'Tanggal Masuk', 'align' => 'left'],
        'warranty_expire' => ['label' => 'Masa Garansi', 'align' => 'left'],
        'garansi_exp' => ['label' => 'Garansi Vendor', 'align' => 'left'],
        'broken_date' => ['label' => 'Tanggal Rusak', 'align' => 'left'],
        'status' => ['label' => 'Status', 'align' => 'left'],
        'condition' => ['label' => 'Kondisi', 'align' => 'left'],
        'no_spb' => ['label' => 'No. SPB', 'align' => 'left'],
        'document_number' => ['label' => 'Nomor Dokumen', 'align' => 'left'],
        'pic' => ['label' => 'PIC', 'align' => 'left'],
        'photo_url' => ['label' => 'Foto', 'align' => 'center'],
        'document_url' => ['label' => 'Dokumen', 'align' => 'center'],
        'notes' => ['label' => 'Catatan', 'align' => 'left'],
    ];

    /**
     * @return array<int, string>
     */
    public static function columnKeys(): array
    {
        return array_keys(self::COLUMNS);
    }

    /**
     * Urutkan & buang key tak dikenal, kembalikan key dalam urutan kanonik.
     *
     * @param  array<int, string>  $requested
     * @return array<int, string>
     */
    public static function normalizeColumns(array $requested): array
    {
        $set = array_flip($requested);

        return array_values(array_filter(
            self::columnKeys(),
            fn (string $key): bool => isset($set[$key]),
        ));
    }

    /**
     * @param  Builder<Asset>  $query
     * @param  array<int, string>  $columns
     */
    public function xlsx(Builder $query, array $columns): BinaryFileResponse
    {
        $columns = self::normalizeColumns($columns);
        $filename = 'laporan_daftar_aset_'.now()->format('Y-m-d').'.xlsx';
        $tempPath = storage_path('app/'.Str::uuid().'.xlsx');

        $writer = SimpleExcelWriter::create($tempPath);

        $writer->addHeader(array_map(
            fn (string $key): string => self::COLUMNS[$key]['label'],
            $columns,
        ));

        $query->lazy(500)->each(function (Asset $asset) use ($writer, $columns): void {
            $row = [];

            foreach ($columns as $key) {
                $row[] = $this->value($key, $asset, false);
            }

            $writer->addRow($row);
        });

        $writer->close();

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    /**
     * @param  Builder<Asset>  $query
     * @param  array<int, string>  $columns
     * @param  array<string, string>  $filterSummary
     */
    public function pdf(Builder $query, array $columns, array $filterSummary = []): \Symfony\Component\HttpFoundation\Response
    {
        $columns = self::normalizeColumns($columns);
        $filename = 'laporan_daftar_aset_'.now()->format('Y-m-d').'.pdf';

        $assets = $query->get();

        $rows = $assets->map(function (Asset $asset) use ($columns): array {
            return array_map(
                fn (string $key): string => $this->value($key, $asset, true),
                $columns,
            );
        })->all();

        $columnMeta = array_map(
            fn (string $key): array => self::COLUMNS[$key],
            $columns,
        );

        // Sedikit kolom → portrait; banyak kolom → landscape.
        $orientation = count($columns) <= 6 ? 'portrait' : 'landscape';

        $pdf = Pdf::loadView('reports.assets_pdf', [
            'rows' => $rows,
            'columnMeta' => $columnMeta,
            'filterSummary' => $filterSummary,
            'total' => $assets->count(),
            'printedAt' => now(),
            'orientation' => $orientation,
        ])->setPaper('a4', $orientation);

        return $pdf->download($filename);
    }

    /**
     * Nilai tampilan sebuah kolom untuk satu aset.
     *
     * @param  bool  $forPdf  true → format uang dengan "Rp"; false → angka murni.
     */
    private function value(string $key, Asset $asset, bool $forPdf): string
    {
        return match ($key) {
            'kode_asset' => (string) ($asset->kode_asset ?? ''),
            'item' => $this->itemLabel($asset),
            'brand' => (string) ($asset->brand ?? ''),
            'model' => (string) ($asset->model ?? ''),
            'serial_number' => (string) ($asset->serial_number ?? ''),
            'part_number' => (string) ($asset->part_number ?? ''),
            'purchase_date' => $this->date($asset->purchase_date),
            'purchase_price' => $this->money($asset->purchase_price, $forPdf),
            'vendor_name' => (string) ($asset->vendor_name ?? ''),
            'location' => (string) ($asset->location?->name ?? ''),
            'department' => (string) ($asset->department?->nama_department ?? ''),
            'asset_type' => $this->assetTypeLabel($asset->asset_type),
            'acquisition_cost' => $this->money($asset->acquisition_cost, $forPdf),
            'useful_life_years' => $asset->useful_life_years !== null ? (string) $asset->useful_life_years : '',
            'depreciation_method' => $this->depreciationLabel($asset->depreciation_method),
            'accumulated_depreciation' => $this->money($asset->accumulated_depreciation, $forPdf),
            'in_come_date' => $this->date($asset->in_come_date),
            'warranty_expire' => $this->date($asset->warranty_expire),
            'garansi_exp' => $this->date($asset->garansi_exp),
            'broken_date' => $this->date($asset->broken_date),
            'status' => $asset->status instanceof AssetStatus ? $asset->status->label() : (string) ($asset->status ?? ''),
            'condition' => (string) ($asset->condition ?? ''),
            'no_spb' => (string) ($asset->no_spb ?? ''),
            'document_number' => (string) ($asset->document_number ?? ''),
            'pic' => is_array($asset->pic) ? implode(', ', $asset->pic) : (string) ($asset->pic ?? ''),
            'photo_url' => $this->presence($asset->photo_url),
            'document_url' => $this->presence($asset->document_url),
            'notes' => (string) ($asset->notes ?? ''),
            default => '',
        };
    }

    private function itemLabel(Asset $asset): string
    {
        $item = $asset->item;

        if (! $item) {
            return '';
        }

        return trim(($item->code ? $item->code.' - ' : '').($item->name ?? ''));
    }

    private function date(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return $value instanceof \DateTimeInterface
            ? $value->format('d/m/Y')
            : (string) $value;
    }

    private function money(mixed $value, bool $forPdf): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $number = (float) $value;
        $formatted = number_format($number, 0, ',', '.');

        return $forPdf ? 'Rp '.$formatted : $formatted;
    }

    /**
     * @param  array<int, string>|null  $value
     */
    private function presence(mixed $value): string
    {
        if (is_array($value)) {
            return count($value) > 0 ? 'Ya' : 'Tidak';
        }

        return ($value !== null && $value !== '' && $value !== '[]') ? 'Ya' : 'Tidak';
    }

    private function assetTypeLabel(?string $type): string
    {
        return match ($type) {
            'fixed_asset' => 'Aktiva Tetap',
            'equipment' => 'Peralatan',
            default => '',
        };
    }

    private function depreciationLabel(?string $method): string
    {
        return match ($method) {
            'straight_line' => 'Garis Lurus',
            'declining_balance' => 'Saldo Menurun',
            'none' => 'Tidak Disusutkan',
            default => '',
        };
    }
}
