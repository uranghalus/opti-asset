<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    /**
     * Daftar nama perusahaan/perangkat untuk data dummy.
     */
    private const BRANDS = [
        'PT Mega Teknologi',
        'PT Prima Sejahtera',
        'PT Mitra Internasional',
        'PT Global Kreasi',
        'PT Sentosa Abadi',
        'PT Artha Jaya',
        'PT Dharma Bhakti',
        'PT Maju Bersama',
    ];

    /**
     * Daftar model/item umum.
     */
    private const MODELS = [
        'Server X1',
        'Laptop Pro 15',
        'Desktop Slim',
        'Monitor 24 inch',
        'Printer Laser',
        'Router Enterprise',
        'Switch Managed 24 port',
        'UPS 1500VA',
        'AC Central',
        'Furniture Desk',
        'Furniture Chair',
        'Kursi Ergonomis',
        'Lemari Arsip',
        'Pintu Gerbang',
        'Lampu LED Panel',
    ];

    /**
     * Daftar status aset.
     */
    private const STATUSES = ['ACT', 'LOAN', 'RPR', 'MUT', 'DSP'];

    /**
     * Daftar kondisi aset.
     */
    private const CONDITIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat', null];

    /**
     * Daftar jenis aset.
     */
    private const ASSET_TYPES = ['fixed_asset', 'equipment'];

    /**
     * Metode depresiasi.
     */
    private const DEPRECIATION_METHODS = ['straight_line', 'declining_balance', 'none'];

    private $assetCounter = 1;

    /**
     * Buat kode asset unik.
     */
    private function generateKodeAsset(): string
    {
        $year = now()->year;

        return 'AST-'.$year.'-'.str_pad($this->assetCounter, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Buat nomor SPB unik.
     */
    private function generateNoSpb(int $index): string
    {
        return 'SPB-'.(2024 + ($index % 3)).'-RN-'.str_pad($index + 1, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Seed the application database.
     */
    public function run(): void
    {
        $tenants = Tenant::all();
        $locations = Location::all();
        $departments = Department::all();
        $assetGroups = AssetGroup::all();
        $assetCategories = AssetCategory::all();
        $assetClusters = AssetCluster::all();
        $assetSubClusters = AssetSubCluster::all();

        if ($tenants->isEmpty()) {
            $this->command->warn('Tidak ada tenant untuk seeding asset. Lewati...');

            return;
        }

        // Tentukan jumlah aset per tenant
        $assetsPerTenant = 25;
        $totalAssets = $tenants->count() * $assetsPerTenant;

        foreach ($tenants as $tenant) {
            $this->command->info("Membuat {$assetsPerTenant} aset untuk tenant: {$tenant->name}");

            for ($i = 0; $i < $assetsPerTenant; $i++) {
                // Buat item dulu
                $item = Item::create([
                    'code' => 'ITM-'.strtoupper($tenant->code).'-'.str_pad($this->assetCounter, 4, '0', STR_PAD_LEFT),
                    'name' => fake()->words(2, true),
                    'description' => fake()->optional()->sentence(),
                ]);

                // Tentukan lokasi dan departemen secara acak (atau null)
                $location = $locations->isEmpty() ? null : $locations->random();
                $department = $departments->isEmpty() ? null : $departments->random();

                // Tentukan kategori/cluster secara acak (atau null)
                $assetGroup = $assetGroups->isEmpty() ? null : $assetGroups->random();
                $assetCategory = $assetCategories->isEmpty() ? null : $assetCategories->random();
                $assetCluster = $assetClusters->isEmpty() ? null : $assetClusters->random();
                $assetSubCluster = $assetSubClusters->isEmpty() ? null : $assetSubClusters->random();

                // Generate data acak
                $now = now();
                $purchaseDate = $now->copy()->subMonths(rand(3, 36));

                // Hitung tanggal garansi (1-3 tahun setelah pembelian)
                $warrantyExpire = $purchaseDate->copy()->addYears(rand(1, 3));

                // Tentukan status dengan bobot (lebih banyak ACT)
                $statusWeights = [
                    'ACT' => 60,
                    'LOAN' => 10,
                    'RPR' => 10,
                    'MUT' => 10,
                    'DSP' => 10,
                ];
                $status = $this->weightedRandom($statusWeights);

                // Tentukan kondisi berdasarkan status
                $condition = $status === 'ACT'
                    ? (fake()->boolean(85) ? 'Baik' : 'Rusak Ringan')
                    : null;

                // Tentukan aset type
                $assetType = fake()->randomElement(self::ASSET_TYPES);

                // Hitung acquisition cost berdasarkan tipe aset
                $acquisitionCost = null;
                $usefulLifeYears = null;
                $depreciationMethod = 'none';

                if ($assetType === 'fixed_asset') {
                    $acquisitionCost = fake()->numberBetween(5_000_000, 500_000_000);
                    $usefulLifeYears = fake()->numberBetween(3, 10);
                    $depreciationMethod = fake()->randomElement(self::DEPRECIATION_METHODS);
                }

                $accumulatedDepreciation = 0;
                if ($acquisitionCost && $usefulLifeYears) {
                    $yearsPassed = $purchaseDate->diffInYears($now);
                    $annualDepreciation = match ($depreciationMethod) {
                        'straight_line' => $acquisitionCost / $usefulLifeYears,
                        'declining_balance' => $acquisitionCost * 0.2,
                        default => 0,
                    };
                    $accumulatedDepreciation = min($acquisitionCost, $annualDepreciation * $yearsPassed);
                }

                Asset::create([
                    'tenant_id' => $tenant->id,
                    'item_id' => $item->id,
                    'condition' => $condition,
                    'purchase_date' => $purchaseDate,
                    'purchase_price' => fake()->optional(70)->randomFloat(2, 1_000_000, 100_000_000),
                    'in_come_date' => $purchaseDate,
                    'broken_date' => null,
                    'warranty_expire' => $warrantyExpire,
                    'location_id' => $location?->id,
                    'department_id' => $department?->id,
                    'assigned_user_id' => null,
                    'assigned_status' => 'AVAILABLE',
                    'brand' => fake()->optional(60)->randomElement(self::BRANDS),
                    'model' => fake()->optional(80)->randomElement(self::MODELS),
                    'part_number' => fake()->optional()->numerify('PN-####-####'),
                    'serial_number' => fake()->optional()->numerify('SN-XXXXXXXX'),
                    'no_spb' => fake()->optional(85)->numerify('SPB-####'),
                    'document_number' => fake()->optional()->numerify('DOC-####'),
                    'pic' => fake()->optional()->name(),
                    'notes' => fake()->optional()->sentence(),
                    'photo_url' => null,
                    'document_url' => null,
                    'kode_asset' => $this->generateKodeAsset(),
                    'garansi_exp' => $warrantyExpire,
                    'status' => $status,
                    'vendor_name' => fake()->optional(40)->randomElement(self::BRANDS),
                    'asset_group_id' => $assetGroup?->id,
                    'asset_category_id' => $assetCategory?->id,
                    'asset_cluster_id' => $assetCluster?->id,
                    'asset_sub_cluster_id' => $assetSubCluster?->id,
                    'asset_type' => $assetType,
                    'acquisition_cost' => $acquisitionCost,
                    'useful_life_years' => $usefulLifeYears,
                    'depreciation_method' => $depreciationMethod,
                    'accumulated_depreciation' => round($accumulatedDepreciation, 2),
                    'capitalization_threshold_id' => null,
                    'type_override_reason' => null,
                ]);

                $this->assetCounter++;
            }
        }

        $this->command->info("Asset seeder selesai: {$totalAssets} records dibuat untuk {$tenants->count()} tenant.");
    }

    /**
     * Pilih secara acak dengan bobot.
     */
    private function weightedRandom(array $weights): mixed
    {
        $total = array_sum($weights);
        $rand = fake()->numberBetween(1, $total);
        $sum = 0;

        foreach ($weights as $key => $weight) {
            $sum += $weight;
            if ($rand <= $sum) {
                return $key;
            }
        }

        return array_key_last($weights);
    }
}
