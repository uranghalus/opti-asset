<?php

namespace App\Console\Commands;

use App\Enums\ClassificationType;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

#[Signature('app:backfill-classification-type {--dry-run : Report the mapping without writing anything}')]
#[Description('Backfill classification_type on classification nodes from connected asset types')]
class BackfillClassificationTypeCommand extends Command
{
    /**
     * Classification table => assets FK column, ordered top-down, with the
     * parent table/column used to inherit and validate the node's type.
     *
     * @var array<string, array{column: literal-string, parent_table: string|null, parent_column: literal-string|null}>
     */
    private const LEVELS = [
        'asset_groups' => ['column' => 'asset_group_id', 'parent_table' => null, 'parent_column' => null],
        'asset_categories' => ['column' => 'asset_category_id', 'parent_table' => 'asset_groups', 'parent_column' => 'asset_group_id'],
        'asset_clusters' => ['column' => 'asset_cluster_id', 'parent_table' => 'asset_categories', 'parent_column' => 'asset_category_id'],
        'asset_sub_clusters' => ['column' => 'asset_sub_cluster_id', 'parent_table' => 'asset_clusters', 'parent_column' => 'asset_cluster_id'],
    ];

    /**
     * @var array{mixed: int, unmapped: int, conflicts: int, written: int}
     */
    private array $summary = ['mixed' => 0, 'unmapped' => 0, 'conflicts' => 0, 'written' => 0];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $parentTypes = [];

        foreach (self::LEVELS as $table => $level) {
            $report = $this->buildReport($table, $level, $this->assetTypeCounts($level['column']), $parentTypes);
            $this->renderReport($table, $report);

            $this->summary['mixed'] += count($report['mixed']);
            $this->summary['unmapped'] += count($report['unmapped']);
            $this->summary['conflicts'] += count($report['conflicts']);

            $parentTypes = $this->assignedTypes($report);

            if (! $dryRun) {
                $this->summary['written'] += $this->apply($table, $report);
            }
        }

        if (! $dryRun) {
            $this->flushClassificationCache();
        }

        $this->newLine();
        if ($dryRun) {
            $this->warn("Dry run: no rows were written. {$this->summary['mixed']} mixed node(s) need a split, {$this->summary['conflicts']} conflict(s) need business review, {$this->summary['unmapped']} root node(s) defaulted pending review.");
        } else {
            $this->info("Classification type written for {$this->summary['written']} node(s). {$this->summary['mixed']} mixed node(s) still need a split, {$this->summary['conflicts']} conflict(s) skipped pending business review, {$this->summary['unmapped']} root node(s) defaulted pending review.");
        }

        return self::SUCCESS;
    }

    /**
     * Per-node asset_type counts from connected assets. The match is a literal
     * whitelist, so the column can never be injected.
     *
     * @param  'asset_group_id'|'asset_category_id'|'asset_cluster_id'|'asset_sub_cluster_id'  $assetColumn
     * @return Collection<int, array{node_id: string, equipment_count: int, fixed_count: int}>
     */
    private function assetTypeCounts(string $assetColumn): Collection
    {
        $counts = match ($assetColumn) {
            'asset_group_id' => "asset_group_id as node_id, sum(asset_type = 'equipment') as equipment_count, sum(asset_type = 'fixed_asset') as fixed_count",
            'asset_category_id' => "asset_category_id as node_id, sum(asset_type = 'equipment') as equipment_count, sum(asset_type = 'fixed_asset') as fixed_count",
            'asset_cluster_id' => "asset_cluster_id as node_id, sum(asset_type = 'equipment') as equipment_count, sum(asset_type = 'fixed_asset') as fixed_count",
            'asset_sub_cluster_id' => "asset_sub_cluster_id as node_id, sum(asset_type = 'equipment') as equipment_count, sum(asset_type = 'fixed_asset') as fixed_count",
        };

        return DB::table('assets')
            ->selectRaw($counts)
            ->whereNotNull($assetColumn)
            ->groupBy($assetColumn)
            ->get()
            ->map(fn (object $row): array => [
                'node_id' => (string) $row->node_id,
                'equipment_count' => (int) $row->equipment_count,
                'fixed_count' => (int) $row->fixed_count,
            ]);
    }

    /**
     * Decide the type per node: unanimous asset type wins, mixed nodes take the
     * dominant type (fixed_asset on ties — keeps the depreciation treatment) and
     * are flagged for a split; unmapped nodes inherit the parent's decided type,
     * root nodes default to aktiva_tetap pending review. Any node whose decided
     * type differs from its parent goes to conflicts instead of being written —
     * the composite FK would reject it, and the split is a business decision.
     *
     * @param  array{column: literal-string, parent_table: string|null, parent_column: literal-string|null}  $level
     * @param  Collection<int, array{node_id: string, equipment_count: int, fixed_count: int}>  $mappings
     * @param  array<string, string>  $parentTypes
     * @return array{peralatan: array<int, string>, aktiva_tetap: array<int, string>, mapped_peralatan: int, mapped_aktiva_tetap: int, mixed: array<int, array{id: string, name: string, equipment: int, fixed: int, assigned: string}>, conflicts: array<int, array{id: string, name: string, reason: string}>, unmapped: array<int, string>}
     */
    private function buildReport(string $table, array $level, Collection $mappings, array $parentTypes): array
    {
        $report = [
            'peralatan' => [],
            'aktiva_tetap' => [],
            'mapped_peralatan' => 0,
            'mapped_aktiva_tetap' => 0,
            'mixed' => [],
            'conflicts' => [],
            'unmapped' => [],
        ];

        $decided = [];
        $mixedDecided = [];
        $mappedPeralatan = 0;
        $mappedAktivaTetap = 0;
        foreach ($mappings as $mapping) {
            $nodeId = $mapping['node_id'];
            $equipment = $mapping['equipment_count'];
            $fixed = $mapping['fixed_count'];

            if ($equipment > 0 && $fixed === 0) {
                $decided[$nodeId] = ClassificationType::PERALATAN->value;

                continue;
            }

            if ($fixed > 0 && $equipment === 0) {
                $decided[$nodeId] = ClassificationType::AKTIVA_TETAP->value;

                continue;
            }

            $assigned = $fixed >= $equipment ? ClassificationType::AKTIVA_TETAP->value : ClassificationType::PERALATAN->value;
            $decided[$nodeId] = $assigned;
            $mixedDecided[$nodeId] = [
                'id' => $nodeId,
                'equipment' => $equipment,
                'fixed' => $fixed,
                'assigned' => $assigned,
            ];
        }

        $unmappedIds = DB::table($table)
            ->whereNotIn('id', array_keys($decided))
            ->whereNull('classification_type')
            ->pluck('id')
            ->map(fn (mixed $id): string => (string) $id)
            ->all();

        /**
         * @var array<string, string|null> $parentIdsByNode
         */
        $parentIdsByNode = $level['parent_column'] !== null
            ? DB::table($table)->pluck($level['parent_column'], 'id')->all()
            : [];

        $namesByNode = DB::table($table)->pluck('name', 'id')
            ->map(fn (mixed $name): string => (string) $name)
            ->all();

        foreach ($decided as $nodeId => $assigned) {
            $parentType = $this->parentTypeFor($nodeId, $level, $parentIdsByNode, $parentTypes);

            if ($parentType !== null && $parentType !== $assigned) {
                $report['conflicts'][] = [
                    'id' => $nodeId,
                    'name' => $namesByNode[$nodeId] ?? '',
                    'reason' => "assigned {$assigned} but parent is {$parentType} — needs a node split",
                ];

                continue;
            }

            if ($assigned === ClassificationType::PERALATAN->value) {
                $report['peralatan'][] = $nodeId;
                $mappedPeralatan++;
            } else {
                $report['aktiva_tetap'][] = $nodeId;
                $mappedAktivaTetap++;
            }

            if (isset($mixedDecided[$nodeId])) {
                $entry = $mixedDecided[$nodeId];
                $report['mixed'][] = [
                    'id' => $nodeId,
                    'name' => $namesByNode[$nodeId] ?? '',
                    'equipment' => $entry['equipment'],
                    'fixed' => $entry['fixed'],
                    'assigned' => $entry['assigned'],
                ];
            }
        }

        foreach ($unmappedIds as $unmappedId) {
            $parentType = $this->parentTypeFor($unmappedId, $level, $parentIdsByNode, $parentTypes);

            if ($level['parent_table'] !== null && $parentType === null) {
                $report['conflicts'][] = [
                    'id' => $unmappedId,
                    'name' => $namesByNode[$unmappedId] ?? '',
                    'reason' => 'no assets of its own and parent type unresolved — needs business review',
                ];

                continue;
            }

            $inherited = $level['parent_table'] !== null
                ? $parentType
                : ClassificationType::AKTIVA_TETAP->value;

            if ($level['parent_table'] === null) {
                $report['unmapped'][] = $unmappedId;
            }

            if ($inherited === ClassificationType::PERALATAN->value) {
                $report['peralatan'][] = $unmappedId;
            } else {
                $report['aktiva_tetap'][] = $unmappedId;
            }
        }

        $report['mapped_peralatan'] = $mappedPeralatan;
        $report['mapped_aktiva_tetap'] = $mappedAktivaTetap;

        return $report;
    }

    /**
     * The decided type of the node's parent, or null when the parent is
     * unresolved (no parent, or the parent itself has no type yet). Falls back
     * to the parent's persisted type so re-runs after a partial state resolve
     * from the database, keeping the command idempotent.
     *
     * @param  array{column: literal-string, parent_table: string|null, parent_column: literal-string|null}  $level
     * @param  array<string, string|null>  $parentIdsByNode
     * @param  array<string, string>  $parentTypes
     */
    private function parentTypeFor(string $nodeId, array $level, array $parentIdsByNode, array $parentTypes): ?string
    {
        if ($level['parent_table'] === null || $level['parent_column'] === null) {
            return null;
        }

        $parentId = $parentIdsByNode[$nodeId];

        return $parentTypes[$parentId]
            ?? DB::table($level['parent_table'])->where('id', $parentId)->value('classification_type');
    }

    /**
     * Node id => decided type for the level, used by child levels to inherit
     * and validate. Includes every node the FK will accept.
     *
     * @param  array{peralatan: array<int, string>, aktiva_tetap: array<int, string>}  $report
     * @return array<string, string>
     */
    private function assignedTypes(array $report): array
    {
        $types = [];
        foreach ($report['peralatan'] as $id) {
            $types[$id] = ClassificationType::PERALATAN->value;
        }
        foreach ($report['aktiva_tetap'] as $id) {
            $types[$id] = ClassificationType::AKTIVA_TETAP->value;
        }

        return $types;
    }

    /**
     * @param  array{peralatan: array<int, string>, aktiva_tetap: array<int, string>}  $report
     */
    private function apply(string $table, array $report): int
    {
        $written = 0;

        if ($report['peralatan'] !== []) {
            $written += DB::table($table)
                ->whereIn('id', $report['peralatan'])
                ->update(['classification_type' => ClassificationType::PERALATAN->value]);
        }

        if ($report['aktiva_tetap'] !== []) {
            $written += DB::table($table)
                ->whereIn('id', $report['aktiva_tetap'])
                ->update(['classification_type' => ClassificationType::AKTIVA_TETAP->value]);
        }

        return $written;
    }

    /**
     * @param  array{mapped_peralatan: int, mapped_aktiva_tetap: int, mixed: array<int, array{id: string, name: string, equipment: int, fixed: int, assigned: string}>, conflicts: array<int, array{id: string, name: string, reason: string}>, unmapped: array<int, string>}  $report
     */
    private function renderReport(string $table, array $report): void
    {
        $total = DB::table($table)->count();
        $this->info("{$table}: {$total} node(s) — {$report['mapped_peralatan']} peralatan, {$report['mapped_aktiva_tetap']} aktiva_tetap (incl. inherited/default), ".count($report['unmapped']).' unmapped root, '.count($report['conflicts']).' conflict(s).');

        if ($report['mixed'] !== []) {
            $rows = array_map(fn (array $node): array => [
                $node['name'],
                $node['equipment'],
                $node['fixed'],
                $node['assigned'],
            ], $report['mixed']);
            $this->table(['Node', 'Equipment assets', 'Fixed assets', 'Assigned (dominant)'], $rows);
        }

        if ($report['conflicts'] !== []) {
            $rows = array_map(fn (array $node): array => [
                $node['name'],
                $node['reason'],
            ], $report['conflicts']);
            $this->table(['Node', 'Conflict'], $rows);
        }
    }

    private function flushClassificationCache(): void
    {
        foreach (DB::table('tenants')->pluck('id') as $tenantId) {
            Cache::forget('classification.tree.'.$tenantId);
        }
    }
}
