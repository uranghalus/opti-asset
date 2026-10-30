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
import { edit, show } from '@/routes/tenant/assets';
import type { ClassificationLevel } from '@/types/classification';
import type { Asset } from './types';

/**
 * Kartu aset â€” komponen tanda tangan sistem (DESIGN.md Â§7).
 * Hierarki baca: status â†’ nama â†’ kode (mono) â†’ lokasi/departemen.
 * Chain klasifikasi scope-relative (ADR 0002): hanya level di bawah
 * scope, kode mono-first, wrap dua baris â€” truncation tidak pernah
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
                'group relative flex gap-3 rounded-lg border border-border-subtle bg-surface-card p-3 shadow-soft transition-[box-shadow,transform,border-color] duration-200',
                'hover:shadow-elevated hover:-translate-y-[2px] hover:border-brand-subtle',
                selected && 'bg-brand-subtle border-brand',
                isDisposed && 'opacity-70 saturate-[0.6]',
            )}
        >
            {/* Pilihan â€” target 44px, jelas di kedua tema */}
            <label className="flex shrink-0 cursor-pointer items-start pt-0.5">
                <Checkbox
                    checked={selected}
                    onCheckedChange={onSelect}
                    aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                    className="size-5"
                />
            </label>

            {/* Thumbnail â€” identitas visual, bukan spanduk */}
            <Link
                href={withReturnTo(show.url({ asset: asset.id }))}
                aria-hidden={photoUrl ? undefined : true}
                tabIndex={photoUrl ? undefined : -1}
                className="block size-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken shadow-inset"
            >
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                    />
                ) : (
                    <span className="flex size-full items-center justify-center text-text-tertiary">
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
                            className="block truncate text-sm font-semibold text-text-primary transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                            {asset.item?.name ?? 'Tanpa nama'}
                        </Link>
                        <p className="mt-0.5 truncate font-mono text-xs text-text-tertiary">
                            {asset.kode_asset ?? 'â€”'}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge value={asset.status} withIcon={false} />
                        <TipeBadge value={asset.asset_type} />
                    </div>
                </div>

                <p className="mt-0.5 truncate text-xs text-text-tertiary">
                    {[asset.brand, asset.model].filter(Boolean).join(' Â· ')}
                    {asset.serial_number && ` Â· SN ${asset.serial_number}`}
                </p>

                {chainParts.length > 0 && (
                    <p
                        aria-label="Klasifikasi"
                        className="line-clamp-2 text-xs leading-relaxed break-words text-text-tertiary"
                    >
                        {chainParts.map((part) => (
                            <span
                                key={part.key}
                                className="mr-2 inline-flex items-baseline gap-1"
                            >
                                {part.code && (
                                    <span className="font-mono font-semibold text-text-primary/80">
                                        {part.code}
                                    </span>
                                )}
                                <span>{part.name}</span>
                                <span className="text-text-tertiary/70">
                                    {part.label}
                                </span>
                            </span>
                        ))}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <div className="flex min-w-0 flex-col gap-0.5 text-xs text-text-tertiary">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin aria-hidden className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {asset.location?.name ?? 'â€”'}
                            </span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Building2
                                aria-hidden
                                className="size-3.5 shrink-0"
                            />
                            <span className="truncate">
                                {asset.department?.nama_department ?? 'â€”'}
                            </span>
                        </span>
                    </div>

                    {/* Aksi selalu terlihat â€” target 44px */}
                    <span className="flex shrink-0 items-center gap-0.5">
                        <Link
                            href={withReturnTo(show.url({ asset: asset.id }))}
                        >
                            <Button
                                variant="soft-secondary"
                                size="icon"
                                aria-label="Lihat detail"
                                className="size-9 rounded-md hover:bg-surface-hover"
                            >
                                <FileText className="size-4" />
                            </Button>
                        </Link>
                        <Link
                            href={withReturnTo(edit.url({ asset: asset.id }))}
                        >
                            <Button
                                variant="soft-secondary"
                                size="icon"
                                aria-label="Ubah aset"
                                className="size-9 rounded-md hover:bg-surface-hover"
                            >
                                <Pencil className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="soft-secondary"
                            size="icon"
                            aria-label="Hapus aset"
                            onClick={onDelete}
                            className="size-9 rounded-md hover:bg-surface-hover hover:text-destructive"
                        >
                            <Trash2 className="size-4 text-destructive" />
                        </Button>
                    </span>
                </div>
            </div>
        </article>
    );
}

