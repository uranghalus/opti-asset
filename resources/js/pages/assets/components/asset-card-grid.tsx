import { Link } from '@inertiajs/react';
import { Inbox, LayoutGrid, Plus, Table2, X } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ResourcePagination } from '@/components/resource-pagination';
import { Button } from '@/components/ui/button';
import { withReturnTo } from '@/lib/asset-return';
import { cn } from '@/lib/utils';
import { create } from '@/routes/assets';
import type { ClassificationLevel } from '@/types/classification';
import { AssetCard } from './asset-card';
import { AssetLedgerTable } from './asset-ledger-table';
import type { Asset, PaginatedData } from './types';

export type AssetListView = 'cards' | 'table';

const VIEW_OPTIONS: {
    value: AssetListView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    { value: 'table', label: 'Tabel', icon: Table2 },
    { value: 'cards', label: 'Kartu', icon: LayoutGrid },
];

/**
 * Badan daftar aset — Kartu (<1280) atau Tabel ledger (≥1280, default).
 * Kondisi kosong dan paginasi sama di kedua tampilan.
 */
export function AssetCardGrid({
    assets,
    selected,
    scopeLevel,
    onToggleSelect,
    onDelete,
    search,
    canClearFilters,
    onClearFilters,
    goToPage,
    view,
    onViewChange,
}: {
    assets: PaginatedData<Asset>;
    selected: Set<string>;
    scopeLevel: ClassificationLevel | null;
    onToggleSelect: (id: string) => void;
    onDelete: (asset: Asset) => void;
    search: string;
    canClearFilters: boolean;
    onClearFilters: () => void;
    goToPage: (url: string | null) => void;
    view: AssetListView;
    onViewChange: (view: AssetListView) => void;
}) {
    if (assets.data.length === 0) {
        const filtered = canClearFilters || search.trim() !== '';

        return (
            <div className="flex min-h-[450px] items-center justify-center px-4 py-6">
                <EmptyState
                    icon={Inbox}
                    variant="plain"
                    title={filtered ? 'Tidak ada hasil' : 'Belum ada aset'}
                    description={
                        filtered
                            ? 'Filter atau kata kunci menutup semua aset. Longgarkan filter untuk melihat lagi.'
                            : 'Catat aset pertama atau impor dari spreadsheet.'
                    }
                    action={
                        filtered ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="border-border"
                            >
                                <X className="mr-2 size-4" />
                                Bersihkan filter
                            </Button>
                        ) : (
                            <Link href={withReturnTo(create.url())}>
                                <Button size="sm" className="font-semibold">
                                    <Plus
                                        className="mr-2 size-4"
                                        strokeWidth={2.5}
                                    />
                                    Tambah aset
                                </Button>
                            </Link>
                        )
                    }
                    secondaryAction={
                        filtered ? (
                            <Link href={withReturnTo(create.url())}>
                                <Button variant="ghost" size="sm">
                                    <Plus className="mr-2 size-4" />
                                    Tambah aset
                                </Button>
                            </Link>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    return (
        <div className="flex min-h-[500px] flex-1 flex-col">
            {/* Saklar tampilan — hanya relevan di lebar tabel (xl) */}
            <div className="hidden items-center justify-end gap-1 border-b border-border px-4 py-2 xl:flex">
                <span className="mr-auto text-xs text-muted-foreground">
                    Tampilan
                </span>
                {VIEW_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onViewChange(option.value)}
                        aria-pressed={view === option.value}
                        className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                            view === option.value
                                ? 'bg-surface-sunken text-foreground dark:bg-muted'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                    >
                        <option.icon className="size-3.5" />
                        {option.label}
                    </button>
                ))}
            </div>

            {view === 'table' ? (
                <div className="flex-1">
                    <AssetLedgerTable
                        assets={assets.data}
                        selected={selected}
                        scopeLevel={scopeLevel}
                        onToggleSelect={onToggleSelect}
                        onDelete={onDelete}
                    />
                </div>
            ) : (
                <div
                    role="feed"
                    aria-label="Kartu aset"
                    className="grid flex-1 grid-cols-1 content-start gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3"
                >
                    {assets.data.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selected.has(asset.id)}
                            scopeLevel={scopeLevel}
                            onSelect={() => onToggleSelect(asset.id)}
                            onDelete={() => onDelete(asset)}
                        />
                    ))}
                </div>
            )}

            {assets.last_page > 1 && (
                <div className="border-t border-border p-4 sm:px-5">
                    <ResourcePagination
                        links={assets.links}
                        currentPage={assets.current_page}
                        lastPage={assets.last_page}
                        from={assets.from}
                        to={assets.to}
                        total={assets.total}
                        onPageChange={goToPage}
                    />
                </div>
            )}
        </div>
    );
}
