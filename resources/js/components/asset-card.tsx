import { Link } from '@inertiajs/react';
import { Building2, ChevronRight, MapPin, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { withReturnTo } from '@/lib/asset-return';
import {
    assetStatusChip,
    assetStatusDot,
    assetStatusLabel,
} from '@/lib/asset-status';
import { cn } from '@/lib/utils';
import { edit, show } from '@/routes/assets';

export type Asset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    status: string;
    condition: string | null;
    purchase_date: string | null;
    created_at: string;
    photo_url: string[];
    document_url: string[];
    item: { id: string; name: string; code: string } | null;
    location: { id: string; name: string } | null;
    department: { id_department: string; nama_department: string } | null;
    asset_group: { id: string; code: string | null; name: string } | null;
    asset_category: { id: string; code: string | null; name: string } | null;
    asset_cluster: { id: string; code: string | null; name: string } | null;
    asset_sub_cluster: { id: string; code: string | null; name: string } | null;
};

export function AssetCard({
    asset,
    selected,
    onSelect,
    onDelete,
}: {
    asset: Asset;
    selected: boolean;
    onSelect: () => void;
    onDelete: () => void;
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

    return (
        <div
            className={cn(
                'glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]',
                selected && 'bg-primary/5 ring-2 ring-primary/50',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Checkbox
                        aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                        checked={selected}
                        onCheckedChange={() => onSelect()}
                        className="mt-1 shrink-0"
                    />
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative size-11 shrink-0">
                            {asset.photo_url?.[0] ? (
                                <>
                                    <img
                                        src={asset.photo_url[0]}
                                        alt="Foto aset"
                                        className="size-11 rounded-xl border border-border/70 object-cover shadow-md ring-1 ring-primary/10"
                                    />
                                    {asset.photo_url.length > 1 && (
                                        <span className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-background px-1 text-[9px] font-bold text-muted-foreground tabular-nums shadow-sm">
                                            +{asset.photo_url.length - 1}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                    <Package
                                        className="size-5"
                                        strokeWidth={1.75}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <Link
                                href={show.url({ asset: asset.id })}
                                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                                {asset.item?.name ?? 'Aset'}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {[asset.brand, asset.model]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Link href={withReturnTo(edit.url({ asset: asset.id }))}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Edit aset"
                        >
                            <Package className="size-3.5" strokeWidth={2} />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={onDelete}
                        aria-label="Hapus aset"
                    >
                        <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                <span className="truncate font-mono text-xs font-bold text-primary tabular-nums">
                    {asset.kode_asset ?? '—'}
                </span>
                <span
                    className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
                        assetStatusChip(asset.status),
                    )}
                >
                    <span
                        className={cn(
                            'size-1.5 rounded-full',
                            assetStatusDot(asset.status),
                        )}
                    />
                    {assetStatusLabel(asset.status)}
                </span>
            </div>

            <div className="relative mt-3.5 flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1">
                    {chain.length > 0 ? (
                        chain.map((level, index) => (
                            <span
                                key={`${level.id}-${index}`}
                                className="inline-flex items-center"
                            >
                                {index > 0 && (
                                    <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
                                )}
                                <span className="inline-flex max-w-40 items-center gap-1 truncate rounded-md px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/70">
                                    <span className="truncate">
                                        {level.name}
                                    </span>
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-muted-foreground">
                            Belum ada klasifikasi
                        </span>
                    )}
                </div>

                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {asset.item && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Package
                                className="size-3.5 shrink-0"
                                strokeWidth={2}
                            />
                            <span className="truncate">{asset.item.name}</span>
                        </p>
                    )}
                    {asset.serial_number && (
                        <p className="flex items-center gap-1.5 truncate font-mono text-muted-foreground">
                            <Package
                                className="size-3.5 shrink-0"
                                strokeWidth={2}
                            />
                            <span className="truncate">
                                {asset.serial_number}
                            </span>
                        </p>
                    )}
                    {asset.document_url?.length > 0 && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Package
                                className="size-3.5 shrink-0"
                                strokeWidth={2}
                            />
                            <span>{asset.document_url.length} dokumen</span>
                        </p>
                    )}
                    {asset.location && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <MapPin
                                className="size-3.5 shrink-0"
                                strokeWidth={2}
                            />
                            <span className="truncate">
                                {asset.location.name}
                            </span>
                        </p>
                    )}
                    {asset.department && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Building2
                                className="size-3.5 shrink-0"
                                strokeWidth={2}
                            />
                            <span className="truncate">
                                {asset.department.nama_department}
                            </span>
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1',
                            conditionAccent(asset.condition),
                        )}
                    >
                        {asset.condition ?? '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatDate(asset.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}

const CONDITION_ACCENTS: Record<string, string> = {
    Baik: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    'Rusak Ringan':
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'Rusak Berat':
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

function conditionAccent(condition: string | null): string {
    if (!condition) {
        return 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300';
    }

    return (
        CONDITION_ACCENTS[condition] ??
        'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300'
    );
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
