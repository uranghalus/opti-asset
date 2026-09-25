import { Link } from '@inertiajs/react';
import {
    Building2,
    FileText,
    MapPin,
    Package,
    Pencil,
    Trash2,
} from 'lucide-react';
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
 * Kartu aset — komponen tanda tangan sistem (DESIGN.md §7).
 * Hierarki baca: status → nama → kode (mono) → lokasi/departemen.
 * Chain klasifikasi scope-relative (ADR 0002): hanya level di bawah
 * scope, kode mono-first, wrap dua baris — truncation tidak pernah
 * mengenai kode.
 */
export function AssetCard({
    asset,
    selected,
    scopeLevel,
    onSelect,
    onDelete,
}: {
    asset: Asset;
    selected: boolean;
    scopeLevel: ClassificationLevel | null;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const byLevel = {
        group: asset.asset_group,
        category: asset.asset_category,
        cluster: asset.asset_cluster,
        'sub-cluster': asset.asset_sub_cluster,
    };
    const order: ClassificationLevel[] = [
        'group',
        'category',
        'cluster',
        'sub-cluster',
    ];
    const chainLevels = scopeLevel
        ? order.slice(order.indexOf(scopeLevel) + 1)
        : order;
    const chainParts = chainLevels
        .map((level) => {
            const node = byLevel[level];

            return node
                ? {
                      key: level,
                      code: node.code,
                      name: node.name,
                      label: LEVEL_SHORT[level],
                  }
                : null;
        })
        .filter((p) => p !== null);

    const photoUrl = asset.photo_url?.[0] ?? null;
    const isDisposed = asset.status === 'DSP';

    return (
        <article
            aria-label={asset.kode_asset ?? 'Aset tanpa kode'}
            className={cn(
                'group relative flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors duration-150',
                'hover:border-border-strong',
                selected && 'bg-primary-muted/50 border-primary',
                isDisposed && 'opacity-70 saturate-[0.6]',
            )}
        >
            {/* Pilihan — target 44px, jelas di kedua tema */}
            <label className="flex shrink-0 cursor-pointer items-start pt-0.5">
                <Checkbox
                    checked={selected}
                    onCheckedChange={onSelect}
                    aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                    className="size-5"
                />
            </label>

            {/* Thumbnail — identitas visual, bukan spanduk */}
            <Link
                href={withReturnTo(show.url({ asset: asset.id }))}
                aria-hidden={photoUrl ? undefined : true}
                tabIndex={photoUrl ? undefined : -1}
                className="block size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-sunken"
            >
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                    />
                ) : (
                    <span className="flex size-full items-center justify-center text-ink-subtle dark:text-muted-foreground">
                        <Package
                            aria-hidden
                            className="size-5"
                            strokeWidth={1.5}
                        />
                    </span>
                )}
            </Link>

            {/* Badan kartu */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link
                            href={withReturnTo(show.url({ asset: asset.id }))}
                            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            {asset.item?.name ?? 'Tanpa nama'}
                        </Link>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {asset.kode_asset ?? '—'}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge value={asset.status} withIcon={false} />
                        <TipeBadge value={asset.asset_type} />
                    </div>
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                    {asset.serial_number && ` · SN ${asset.serial_number}`}
                </p>

                {chainParts.length > 0 && (
                    <p
                        aria-label="Klasifikasi"
                        className="line-clamp-2 text-xs leading-relaxed break-words text-ink-subtle dark:text-muted-foreground/70"
                    >
                        {chainParts.map((part) => (
                            <span
                                key={part.key}
                                className="mr-2 inline-flex items-baseline gap-1"
                            >
                                {part.code && (
                                    <span className="font-mono font-semibold text-foreground/80">
                                        {part.code}
                                    </span>
                                )}
                                <span>{part.name}</span>
                                <span className="text-muted-foreground/50">
                                    {part.label}
                                </span>
                            </span>
                        ))}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <div className="flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin aria-hidden className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {asset.location?.name ?? '—'}
                            </span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Building2
                                aria-hidden
                                className="size-3.5 shrink-0"
                            />
                            <span className="truncate">
                                {asset.department?.nama_department ?? '—'}
                            </span>
                        </span>
                    </div>

                    {/* Aksi selalu terlihat — target 44px */}
                    <span className="flex shrink-0 items-center gap-0.5">
                        <Link
                            href={withReturnTo(show.url({ asset: asset.id }))}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Lihat detail"
                                className="size-9 rounded-md hover:bg-muted"
                            >
                                <FileText className="size-4" />
                            </Button>
                        </Link>
                        <Link
                            href={withReturnTo(edit.url({ asset: asset.id }))}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Ubah aset"
                                className="size-9 rounded-md hover:bg-muted"
                            >
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Hapus aset"
                            onClick={onDelete}
                            className="size-9 rounded-md hover:bg-destructive/10"
                        >
                            <Trash2 className="size-4 text-destructive" />
                        </Button>
                    </span>
                </div>
            </div>
        </article>
    );
}
