<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Services\DepreciationCalculator;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:run-depreciation')]
#[Description('Run monthly depreciation calculation for all active assets')]
class RunDepreciationCommand extends Command
{
    public function __construct(private readonly DepreciationCalculator $calculator)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $assets = Asset::query()
            ->whereNotIn('status', ['DISPOSED'])
            ->whereIn('depreciation_method', ['straight_line', 'declining_balance'])
            ->whereNotNull('acquisition_cost')
            ->whereNotNull('useful_life_years')
            ->whereNotNull('in_come_date')
            ->cursor();

        $updated = 0;
        $bar = $this->output->createProgressBar(0);
        $bar->start();

        foreach ($assets as $asset) {
            $computed = $this->calculator->compute($asset);
            if ((string) $asset->accumulated_depreciation !== $computed) {
                $asset->accumulated_depreciation = $computed;
                $asset->saveQuietly();
                $updated++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Depreciation updated for {$updated} assets.");

        return self::SUCCESS;
    }
}
