<?php

namespace App\Services;

use App\Models\Asset;
use Illuminate\Support\Carbon;

/**
 * FR-13.5 — kalkulasi akumulasi penyusutan otomatis dari metode yang dipilih.
 *
 * Konvensi (disetujui product owner):
 * - straight_line    : nilai perolehan ÷ masa manfaat, per bulan penuh.
 * - declining_balance: double declining (200%), dihitung per bulan dari sisa nilai.
 * - none             : tanpa penyusutan.
 * - Basis waktu: in_come_date (aset mulai digunakan), bulan berjalan dihitung penuh.
 * - Akumulasi dibatasi maksimum nilai perolehan (tidak boleh minus).
 */
class DepreciationCalculator
{
    /**
     * @return numeric-string
     */
    public function compute(Asset $asset, ?Carbon $at = null): string
    {
        $method = $asset->depreciation_method;

        if ($method === 'none' || $method === '') {
            return '0.00';
        }

        $cost = (float) $asset->acquisition_cost;

        if ($cost <= 0 || $asset->useful_life_years === null || $asset->useful_life_years <= 0) {
            return '0.00';
        }

        $monthsInService = $this->monthsInService($asset, $at);

        if ($monthsInService <= 0) {
            return '0.00';
        }

        $accumulated = match ($method) {
            'straight_line' => $this->straightLine($cost, $asset->useful_life_years, $monthsInService),
            'declining_balance' => $this->decliningBalance($cost, $asset->useful_life_years, $monthsInService),
            default => 0.0,
        };

        // Tidak boleh melebihi nilai perolehan.
        $accumulated = min($accumulated, $cost);

        return number_format($accumulated, 2, '.', '');
    }

    /**
     * Straight line: (cost / life_years / 12) × months.
     */
    private function straightLine(float $cost, int $lifeYears, int $months): float
    {
        $monthly = $cost / ($lifeYears * 12);

        return $monthly * $months;
    }

    /**
     * Double declining balance (200%), dihitung bulanan: sisa nilai × (2 / total_months).
     * Setiap bulan sisa nilai berkurang, jadi diakumulasi iteratif.
     */
    private function decliningBalance(float $cost, int $lifeYears, int $months): float
    {
        $totalMonths = $lifeYears * 12;
        $monthlyRate = 2.0 / $totalMonths;
        $remaining = $cost;
        $accumulated = 0.0;

        for ($i = 0; $i < $months; $i++) {
            $depreciation = min($remaining * $monthlyRate, $remaining);
            $accumulated += $depreciation;
            $remaining -= $depreciation;

            if ($remaining <= 0) {
                break;
            }
        }

        return $accumulated;
    }

    /**
     * Bulan kalender penuh sejak in_come_date hingga $at (default sekarang).
     * Bulan yang belum selesai tidak dihitung (partial month = 0).
     */
    private function monthsInService(Asset $asset, ?Carbon $at = null): int
    {
        $start = $asset->in_come_date;

        if (! $start instanceof \DateTimeInterface) {
            return 0;
        }

        $end = $at ?? Carbon::now();
        $start = Carbon::instance($start)->startOfDay();
        $end = $end->copy()->startOfDay();

        if ($end->lessThanOrEqualTo($start)) {
            return 0;
        }

        // Carbon 3 mengembalikan float (mis. 1.5 bulan) — bulan penuh saja.
        $months = (int) floor($start->diffInMonths($end));

        return max($months, 0);
    }
}
