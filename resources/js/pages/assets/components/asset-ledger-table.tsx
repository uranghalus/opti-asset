import { Link, router } from '@inertiajs/react';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { withReturnTo } from '@/lib/asset-return';
import { StatusBadge, TipeBadge } from '@/lib/asset-status';
import { LEVEL_SHORT } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { edit, show } from '@/routes/assets';
import type { ClassificationLevel } from '@/types/classification';
import type { Asset } from './types';

/**
 * Cakupan aktif (ADR 0002): baris hanya merender level DI BAWAH scope —
 * node scope sendiri tidak diulang di setiap baris. Kolom menyusut jadi
 * satu; kode klasifikasi mono-first, wrap dua baris — truncation tidak
 * pernah mengenai kode.
 */
export function scopeColumns(
    scopeLevel: ClassificationLevel | null,
): ClassificationLevel[] {
    const order: ClassificationLevel[] = [
        'group',
        'category',
        'cluster',
        'sub-cluster',
    ];

    if (!scopeLevel) {
        return order;
    }

    return order.slice(order.indexOf(scopeLevel) + 1);
}

function ScopeCells({
    asset,
    columns,
}: {
    asset: Asset;
    columns: ClassificationLevel[];
}) {
    const byLevel = {
        group: asset.asset_group,
        category: asset.asset_category,
        cluster: asset.asset_cluster,
        'sub-cluster': asset.asset_sub_cluster,
    };

    if (columns.length === 0) {
        return <td className="px-3 py-2.5 text-xs text-muted-foreground">—</td>;
    }

    return (
        <td className="max-w-[220px] px-3 py-2.5 text-xs">
            <span className="line-clamp-2 break-words text-ink-subtle dark:text-muted-foreground/70">
                {columns.map((level) => {
                    const node = byLevel[level];

                    if (!node) {
                        return null;
                    }

                    return (
                        <span
                            key={level}
                            className="mr-2 inline-flex items-baseline gap-1"
                        >
                            {node.code && (
                                <span className="font-mono font-semibold text-foreground/80">
                                    {node.code}
                                </span>
                            )}
                            <span>{node.name}</span>
                            <span className="text-muted-foreground/50">
                                {LEVEL_SHORT[level]}
                            </span>
                        </span>
                    );
                })}
            </span>
        </td>
    );
}

/**
 * Tabel ledger desktop (≥1280px, DESIGN.md §9): kepala kolom sunken,
 * baris 44px+, kode mono, angka tabular. Baris terpilih membuka detail;
 * kontrol di dalam baris menghentikan propagasi.
 */
export function AssetLedgerTable({
    assets,
    selected,
    scopeLevel,
    onToggleSelect,
    onDelete,
}: {
    assets: Asset[];
    selected: Set<string>;
    scopeLevel: ClassificationLevel | null;
    onToggleSelect: (id: string) => void;
    onDelete: (asset: Asset) => void;
}) {
    const scopeCols = scopeColumns(scopeLevel);

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-surface-sunken dark:bg-muted">
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                        <th scope="col" className="w-10 px-3 py-2.5">
                            <span className="sr-only">Pilih</span>
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Kode
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Aset
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Status
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Tipe
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Klasifikasi
                            {scopeCols.length > 0 && (
                                <span className="ml-1.5 font-normal normal-case opacity-70">
                                    (
                                    {scopeCols
                                        .map((l) => LEVEL_SHORT[l])
                                        .join(' › ')}
                                    )
                                </span>
                            )}
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Lokasi
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                            Departemen
                        </th>
                        <th scope="col" className="w-28 px-3 py-2.5 text-right">
                            <span className="sr-only">Aksi</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset) => {
                        const isDisposed = asset.status === 'DSP';

                        return (
                            <tr
                                key={asset.id}
                                onClick={() =>
                                    router.visit(
                                        withReturnTo(
                                            show.url({ asset: asset.id }),
                                        ),
                                    )
                                }
                                className={cn(
                                    'cursor-pointer border-b border-border/70 transition-colors hover:bg-surface-sunken/60 dark:hover:bg-muted/60',
                                    selected.has(asset.id) &&
                                        'bg-primary-muted/50',
                                    isDisposed && 'opacity-70 saturate-[0.6]',
                                )}
                            >
                                <td
                                    className="px-3 py-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        checked={selected.has(asset.id)}
                                        onCheckedChange={() =>
                                            onToggleSelect(asset.id)
                                        }
                                        aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                                        className="size-4.5"
                                    />
                                </td>
                                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                                    {asset.kode_asset ?? '—'}
                                </td>
                                <td className="max-w-[240px] px-3 py-2.5">
                                    <Link
                                        href={withReturnTo(
                                            show.url({ asset: asset.id }),
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                        className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                                    >
                                        {asset.item?.name ?? 'Tanpa nama'}
                                    </Link>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {[asset.brand, asset.model]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </td>
                                <td className="px-3 py-2.5">
                                    <StatusBadge
                                        value={asset.status}
                                        withIcon={false}
                                    />
                                </td>
                                <td className="px-3 py-2.5">
                                    <TipeBadge value={asset.asset_type} />
                                </td>
                                <ScopeCells asset={asset} columns={scopeCols} />
                                <td className="max-w-[160px] px-3 py-2.5 text-xs text-muted-foreground">
                                    <span className="block truncate">
                                        {asset.location?.name ?? '—'}
                                    </span>
                                </td>
                                <td className="max-w-[160px] px-3 py-2.5 text-xs text-muted-foreground">
                                    <span className="block truncate">
                                        {asset.department?.nama_department ??
                                            '—'}
                                    </span>
                                </td>
                                <td
                                    className="px-3 py-1.5 text-right"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="inline-flex items-center gap-0.5">
                                        <Link
                                            href={withReturnTo(
                                                show.url({ asset: asset.id }),
                                            )}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Lihat detail"
                                                className="size-8 rounded-md hover:bg-muted"
                                            >
                                                <FileText className="size-3.5" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={withReturnTo(
                                                edit.url({ asset: asset.id }),
                                            )}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Ubah aset"
                                                className="size-8 rounded-md hover:bg-muted"
                                            >
                                                <Pencil className="size-3.5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Hapus aset"
                                            onClick={() => onDelete(asset)}
                                            className="size-8 rounded-md hover:bg-destructive/10"
                                        >
                                            <Trash2 className="size-3.5 text-destructive" />
                                        </Button>
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
