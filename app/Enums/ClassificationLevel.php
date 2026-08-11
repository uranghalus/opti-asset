<?php

namespace App\Enums;

use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;

enum ClassificationLevel: string
{
    case GROUP = 'GROUP';
    case CATEGORY = 'CATEGORY';
    case CLUSTER = 'CLUSTER';
    case SUBCLUSTER = 'SUBCLUSTER';

    /** @return class-string<AssetGroup|AssetCategory|AssetCluster|AssetSubCluster> */
    public function model(): string
    {
        return match ($this) {
            self::GROUP => AssetGroup::class,
            self::CATEGORY => AssetCategory::class,
            self::CLUSTER => AssetCluster::class,
            self::SUBCLUSTER => AssetSubCluster::class,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::GROUP => 'Golongan',
            self::CATEGORY => 'Kategori',
            self::CLUSTER => 'Cluster',
            self::SUBCLUSTER => 'Sub Cluster',
        };
    }
}
