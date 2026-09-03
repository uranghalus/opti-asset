import { Link } from '@inertiajs/react';
import { Inbox, Plus, X } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ResourcePagination } from '@/components/resource-pagination';
import { Button } from '@/components/ui/button';
import { withReturnTo } from '@/lib/asset-return';
import { create } from '@/routes/assets';
import { AssetCard } from './asset-card';
import type { Asset, PaginatedData } from './types';

/**
 * Badan lembar kerja kaca — kepala kolom ledger, baris-baris pos,
 * dan kaki paginasi. Kondisi kosong memakai varian plain agar
 * tidak menumpuk kaca di atas kaca.
 */
export function AssetCardGrid({
    assets,
    selected,
    onToggleSelect,
    onDelete,
    search,
    canClearFilters,
    onClearFilters,
    goToPage,
}: {
    assets: PaginatedData<Asset>;
    selected: Set<string>;
    onToggleSelect: (id: string) => void;
    onDelete: (asset: Asset) => void;
    search: string;
    canClearFilters: boolean;
    onClearFilters: () => void;
    goToPage: (url: string | null) => void;
}) {
    if (assets.data.length === 0) {
        const filtered = canClearFilters || search.trim() !== '';

        return (
            <div className="flex min-h-[450px] items-center justify-center px-4 py-6">
                <EmptyState
                    icon={Inbox}
                    variant="plain"
                    title={
                        filtered ? 'Tidak ada hasil' : 'Manifest masih kosong'
                    }
                    description={
                        filtered
                            ? 'Saringan atau kata kunci menutup semua pos. Longgarkan saringan untuk melihat lagi.'
                            : 'Pilih register di indeks atau catat pos aset pertama.'
                    }
                    action={
                        filtered ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="rounded-md border-white/20 bg-white/10 backdrop-blur-sm"
                            >
                                <X className="mr-2 size-4" />
                                Bersihkan saringan
                            </Button>
                        ) : (
                            <Link href={withReturnTo(create.url())}>
                                <Button
                                    size="sm"
                                    className="rounded-md font-semibold hover:shadow-[0_0_24px_-6px_var(--primary)]"
                                >
                                    <Plus
                                        className="mr-2 size-4"
                                        strokeWidth={2.5}
                                    />
                                    Tambah Aset
                                </Button>
                            </Link>
                        )
                    }
                    secondaryAction={
                        filtered ? (
                            <Link href={withReturnTo(create.url())}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-md"
                                >
                                    <Plus className="mr-2 size-4" />
                                    Tambah Aset
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
            <div
                role="feed"
                aria-label="Kartu aset"
                className="grid flex-1 grid-cols-1 content-start gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3"
            >
                {assets.data.map((asset, i) => (
                    <AssetCard
                        key={asset.id}
                        asset={asset}
                        index={i}
                        selected={selected.has(asset.id)}
                        onSelect={() => onToggleSelect(asset.id)}
                        onDelete={() => onDelete(asset)}
                    />
                ))}
            </div>

            {assets.last_page > 1 && (
                <div className="border-t border-white/10 p-4 sm:px-5">
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
