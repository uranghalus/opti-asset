<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssetDisposalSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have assets and users to reference
        $assets = Asset::where('status', 'ACT')->get();
        $users = User::all();

        if ($assets->isEmpty() || $users->isEmpty()) {
            $this->command->warn('Tidak ada aset aktif atau user untuk seeding disposal. Lewati...');
            return;
        }

        $reasons = [
            'Aset rusak total tidak bisa diperbaiki',
            'Aset sudah melebihi umur ekonomis',
            'Aset tidak lagi dibutuhkan organisasi',
            'Kerusakan parah akibat bencana alam',
            'Obsolesens teknologi, tidak kompatibel sistem baru',
            'Biaya perbaikan melebihi nilai aset',
            'Aset duplikat setelah konsolidasi inventaris',
            'Pergantian dengan model terbaru',
            'Kebijakan rotasi aset perusahaan',
            'Aset hilang/tercuri dan tidak ditemukan',
        ];

        $statuses = ['pending', 'approved', 'rejected'];

        // Buat 20 disposal records
        for ($i = 0; $i < 20; $i++) {
            $asset = $assets->random();
            $user = $users->random();
            $status = $statuses[array_rand($statuses)];
            $disposalDate = $status !== 'pending'
                ? now()->subDays(rand(1, 365))
                : now()->addDays(rand(1, 90));

            AssetDisposal::create([
                'asset_id' => $asset->id,
                'reason' => $reasons[array_rand($reasons)],
                'disposal_date' => $disposalDate,
                'disposed_by' => $user->id,
                'status' => $status,
            ]);

            // Hindari duplikasi asset_id untuk pending/approved
            if (in_array($status, ['pending', 'approved'])) {
                $assets = $assets->where('id', '!=', $asset->id);
                if ($assets->isEmpty()) {
                    break;
                }
            }
        }

        $this->command->info('AssetDisposal seeder selesai: 20 records dibuat.');
    }
}