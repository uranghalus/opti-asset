import { Link } from '@inertiajs/react';
import {
    Building2,
    ChevronRight,
    FileText,
    MapPin,
    Package,
    Pencil,
    Trash2,
} from 'lucide-react';
import { createElement } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { withReturnTo } from '@/lib/asset-return';
import { assetStatusIcon, assetStatusLabel } from '@/lib/asset-status';
import { LEVEL_TINTS } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { edit, show } from '@/routes/assets';
import type { ClassificationLevel } from '@/types/classification';
import type { Asset } from './types';

/**
 * Pita + tinta status: traffic-light ala inventori (hijau, langit,
 * amber, ungu, mawar) di atas netral kaca. Kunci harus literal
 * agar terdeteksi Tailwind JIT.
 */
const STATUS_ART: Record<string, { bar: string; wash: string }> = {
    ACT: {
        bar: 'from-emerald-400 to-teal-500',
        wash: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    },
    LOAN: {
        bar: 'from-sky-400 to-blue-500',
        wash: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    },
    RPR: {
        bar: 'from-amber-400 to-orange-500',
        wash: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    },
    MUT: {
        bar: 'from-fuchsia-400 to-pink-600',
        wash: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
    },
    DSP: {
        bar: 'from-rose-400 to-red-500',
        wash: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    },
};

const FALLBACK_ART = {
    bar: 'from-primary to-secondary',
    wash: 'bg-primary/10 text-primary',
};

const CHAIN_LEVELS: ClassificationLevel[] = [
    'group',
    'category',
    'cluster',
    'sub-cluster',
];

function StatusStamp({ status }: { status: string }) {
    const Icon = assetStatusIcon(status);

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 font-mono text-[13px] font-bold tracking-[0.14em] text-white uppercase ring-1 ring-white/30 backdrop-blur-sm ring-inset',
                'dark:bg-black/55',
            )}
        >
            {createElement(Icon, { className: 'size-3', strokeWidth: 2.5 })}
            {assetStatusLabel(status)}
        </span>
    );
}

/**
 * Kartu Depot — satu aset sebagai satu kartu katalog berwarna:
 * spanduk foto berpita status, cap centang melayang, kode mono,
 * keping klasifikasi sewarna level, dan aksi yang muncul saat hover.
 */ export function AssetCard({
    asset,
    selected,
    onSelect,
    onDelete,
    index = 0,
}: {
    asset: Asset;
    selected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    index?: number;
}) {
    const chain = [
        asset.asset_group,
        asset.asset_category,
        asset.asset_cluster,
        asset.asset_sub_cluster,
    ].filter(Boolean) as Array<{
        id: string;
        code: string | null;
        name: string;
    }>;

    const photoUrl = asset.photo_url?.[0] ?? null;
    const art = STATUS_ART[asset.status] ?? FALLBACK_ART;

    return (
        <article
            aria-label={asset.kode_asset ?? 'Aset tanpa kode'}
            className={cn(
                'animate-card-enter group relative flex flex-col overflow-hidden rounded-lg border border-white/20 bg-card/85 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-200',
                'hover:-translate-y-1 hover:bg-card hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.25)]',
                'active:translate-y-0 active:scale-[0.99]',
                selected &&
                    'bg-primary/[0.07] ring-2 ring-primary/50 ring-inset',
            )}
            style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
        >
            {/* Pita status */}
            <span
                aria-hidden
                className={cn(
                    'absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r',
                    art.bar,
                )}
            />

            {/* Spanduk foto */}
            <div className="relative h-32 shrink-0 overflow-hidden">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={asset.kode_asset ?? 'Aset'}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div
                        className={cn(
                            'flex size-full items-center justify-center',
                            art.wash,
                        )}
                    >
                        <Package
                            aria-hidden
                            className="size-10"
                            strokeWidth={1.25}
                        />
                    </div>
                )}
                <label
                    className={cn(
                        'absolute top-2.5 left-2.5 flex size-9 cursor-pointer items-center justify-center rounded-md border border-white/30 bg-black/35 backdrop-blur-sm transition-colors',
                        'focus-within:ring-2 focus-within:ring-primary focus-within:outline-none hover:bg-black/55',
                        selected && 'border-primary bg-primary',
                    )}
                >
                    <Checkbox
                        checked={selected}
                        onCheckedChange={onSelect}
                        aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                        className="size-5 border-white/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                </label>
                <span className="absolute top-2.5 right-2.5">
                    <StatusStamp status={asset.status} />
                </span>
            </div>

            {/* Badan kartu */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                <div className="min-w-0">
                    <p className="truncate font-mono text-[13px] font-bold tracking-wide text-primary tabular-nums">
                        {asset.kode_asset ?? '—'}
                    </p>
                    <Link
                        href={withReturnTo(show.url({ asset: asset.id }))}
                        className="mt-0.5 block truncate text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        {asset.item?.name ?? 'Tanpa Nama'}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[asset.brand, asset.model]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        {asset.serial_number && ` · SN ${asset.serial_number}`}
                    </p>
                </div>

                {chain.length > 0 && (
                    <p
                        aria-label="Rute klasifikasi"
                        className="flex flex-wrap items-center gap-1"
                    >
                        {chain.map((c, i) => {
                            const tint =
                                LEVEL_TINTS[
                                    CHAIN_LEVELS[i % CHAIN_LEVELS.length]
                                ];

                            return (
                                <span
                                    key={c.id}
                                    className="inline-flex items-center gap-1"
                                >
                                    {i > 0 && (
                                        <ChevronRight
                                            aria-hidden
                                            className="size-3 text-muted-foreground/40"
                                        />
                                    )}
                                    <span
                                        title={c.name}
                                        className={cn(
                                            'rounded-md px-1.5 py-0.5 font-mono text-[13px] font-bold',
                                            tint.bg,
                                            tint.fg,
                                        )}
                                    >
                                        {c.code ?? c.name}
                                    </span>
                                </span>
                            );
                        })}
                    </p>
                )}

                <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-2.5">
                    <p className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
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
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 lg:translate-y-1 lg:opacity-0 lg:transition-all lg:duration-200 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-within:translate-y-0 lg:focus-within:opacity-100">
                        <Link
                            href={withReturnTo(show.url({ asset: asset.id }))}
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
                            href={withReturnTo(edit.url({ asset: asset.id }))}
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
                            onClick={onDelete}
                            className="size-8 rounded-md hover:bg-destructive/10"
                        >
                            <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                    </span>
                </div>
            </div>
        </article>
    );
}
