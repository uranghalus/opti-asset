<?php

namespace App\Actions;

use App\Enums\ClassificationLevel;
use App\Models\AssetGroup;
use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Create item categories from the leaf nodes of the asset classification.
 *
 * A leaf is the deepest node of a branch: a group without categories, a
 * category without clusters, a cluster without sub-clusters, or any
 * sub-cluster. Categories already linked to the same classification node are
 * skipped, so running the generator twice never duplicates rows.
 */
class GenerateCategoriesFromClassificationsAction
{
    /**
     * @return array{created: int, skipped: int, total: int}
     */
    public function handle(): array
    {
        $created = 0;
        $skipped = 0;
        $total = 0;

        /** @var Collection<string, true> $existing keyed by "level:id" */
        $existing = Category::query()
            ->get(['classification_type', 'classification_id'])
            ->mapWithKeys(fn (Category $category): array => [
                $this->key($category->classification_type, $category->classification_id) => true,
            ]);

        $groups = AssetGroup::query()
            ->with(['categories.clusters.subClusters'])
            ->orderBy('sort_order')
            ->get();

        DB::transaction(function () use ($groups, $existing, &$created, &$skipped, &$total): void {
            foreach ($groups as $group) {
                $groupCode = $group->code;

                if ($group->categories->isEmpty()) {
                    $total++;
                    $this->createCategory(
                        $existing,
                        ClassificationLevel::GROUP,
                        $group->id,
                        $group->name,
                        $this->buildCode([$groupCode]),
                        $created,
                        $skipped,
                    );

                    continue;
                }

                foreach ($group->categories as $category) {
                    $categoryCode = $this->buildCode([$groupCode, $category->code]);

                    if ($category->clusters->isEmpty()) {
                        $total++;
                        $this->createCategory(
                            $existing,
                            ClassificationLevel::CATEGORY,
                            $category->id,
                            $category->name,
                            $categoryCode,
                            $created,
                            $skipped,
                        );

                        continue;
                    }

                    foreach ($category->clusters as $cluster) {
                        $clusterCode = $this->buildCode([$groupCode, $category->code, $cluster->code]);

                        if ($cluster->subClusters->isEmpty()) {
                            $total++;
                            $this->createCategory(
                                $existing,
                                ClassificationLevel::CLUSTER,
                                $cluster->id,
                                $cluster->name,
                                $clusterCode,
                                $created,
                                $skipped,
                            );

                            continue;
                        }

                        foreach ($cluster->subClusters as $subCluster) {
                            $total++;
                            $this->createCategory(
                                $existing,
                                ClassificationLevel::SUBCLUSTER,
                                $subCluster->id,
                                $subCluster->name,
                                $this->buildCode([$groupCode, $category->code, $cluster->code, $subCluster->code]),
                                $created,
                                $skipped,
                            );
                        }
                    }
                }
            }
        });

        return ['created' => $created, 'skipped' => $skipped, 'total' => $total];
    }

    /**
     * @param  Collection<string, true>  $existing
     */
    private function createCategory(
        Collection $existing,
        ClassificationLevel $level,
        string $id,
        string $name,
        ?string $code,
        int &$created,
        int &$skipped,
    ): void {
        $name = trim($name);

        if ($name === '') {
            $skipped++;

            return;
        }

        $key = $this->key($level, $id);

        if ($existing->has($key)) {
            $skipped++;

            return;
        }

        Category::create([
            'name' => $name,
            'code' => $code,
            'classification_id' => $id,
            'classification_type' => $level,
        ]);

        $existing->put($key, true);
        $created++;
    }

    /**
     * @param  array<int, string|null>  $segments
     */
    private function buildCode(array $segments): ?string
    {
        $codes = array_values(array_filter(
            $segments,
            static fn (?string $code): bool => $code !== null && trim($code) !== '',
        ));

        return $codes === [] ? null : implode('.', $codes);
    }

    private function key(ClassificationLevel|string|null $level, ?string $id): string
    {
        $levelValue = $level instanceof ClassificationLevel ? $level->value : (string) $level;

        return $levelValue.':'.(string) $id;
    }
}
