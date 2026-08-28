import { Link, router, usePage } from '@inertiajs/react';
import {
    Boxes,
    ChevronRight,
    Filter,
    Layers,
    MapPin,
    Package,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    Building2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { ResourcePagination } from '@/components/resource-pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { rememberAssetListUrl, withReturnTo } from '@/lib/asset-return';
import {
    ASSET_STATUSES,
    assetStatusChip,
    assetStatusDot,
    assetStatusLabel,
} from '@/lib/asset-status';
import { cn } from '@/lib/utils';
import {
    LevelIcon,
    LEVEL_TINTS,
} from '@/lib/classification-levels';
import type { ClassificationNode, ClassificationLevel } from '@/types/classification';
import { LEVEL_LABELS, CHILD_LABELS } from '@/types/classification';

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    ...ASSET_STATUSES.map((status) => ({
        value: status.value,
        label: status.label,
    })),
];

type BrowseTreeNode = ClassificationNode & { children?: BrowseTreeNode[] };

type Asset = {
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

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
};

type PageProps = {
    tree: BrowseTreeNode[];
    selected: { level: ClassificationLevel; id: string } | null;
    breadcrumb: Array<{ id: string; level: ClassificationLevel; code: string | null; name: string }>;
    assets: PaginatedData<Asset> | null;
    groups: Array<{ id: string; code: string | null; name: string }>;
    categories: Array<{ id: string; code: string | null; name: string; asset_group_id: string }>;
    status: string;
};

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
    return CONDITION_ACCENTS[condition] ?? 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300';
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

const MAX_BULK = 100;

function BrowseTreeNodeRow({
    node,
    depth,
    selectedId,
    expandedIds,
    onSelect,
    onToggleExpand,
}: {
    node: BrowseTreeNode;
    depth: number;
    selectedId: string | null;
    expandedIds: Set<string>;
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
}) {
    const level: ClassificationLevel = (['group', 'category', 'cluster', 'sub-cluster'] as ClassificationLevel[])[depth];
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isSelected = selectedId === node.id;
    const isExpanded = expandedIds.has(node.id);
    const tint = LEVEL_TINTS[level];

    const countLabel =
        level === 'sub-cluster'
            ? `${node.asset_count} aset`
            : `${node.child_count} ${CHILD_LABELS[level]}`;

    return (
        <div className="relative">
            <div
                className={cn(
                    'group flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm transition-all duration-150',
                    isSelected
                        ? 'bg-primary/10 font-medium text-primary shadow-[inset_0_0_0_1px_rgba(0,111,207,0.15)]'
                        : 'text-foreground hover:bg-muted/70',
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                role="treeitem"
                aria-selected={isSelected}
                onClick={() => onSelect(node.id)}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleExpand(node.id);
                        }}
                        className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-150 hover:bg-accent',
                            isExpanded && 'rotate-90',
                        )}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Ciutkan' : 'Perluas'}
                    >
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                    </button>
                ) : (
                    <span className="size-6 shrink-0" />
                )}

                <LevelIcon level={level} open={isExpanded} size="sm" />

                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium transition-transform duration-200 group-hover:translate-x-0.5">
                            {node.name}
                        </span>
                        {node.code && (
                            <span
                                className={cn(
                                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]',
                                    tint.bg,
                                    tint.fg,
                                )}
                            >
                                {node.code}
                            </span>
                        )}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                        {countLabel}
                        {node.description ? ` • ${node.description}` : ''}
                    </span>
                </span>

                <span className={cn('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1', tint.bg, tint.fg)}>
                    {node.asset_count}
                </span>
            </div>

            {hasChildren && isExpanded && (
                <div role="group">
                    {children.map((child) => (
                        <BrowseTreeNodeRow
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AssetsBrowse() {
    const { tree, selected: serverSelected, breadcrumb, assets, groups, categories, status: initialStatus } =
        usePage().props as unknown as PageProps;

    const [selectedId, setSelectedId] = useState<string | null>(serverSelected?.id ?? null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [filterOpen, setFilterOpen] = useState(false);
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    const pageIds = assets?.data.map((asset) => asset.id) ?? [];
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedAssets.has(id));

    // Sync selectedId from server-side selected prop
    useEffect(() => {
        if (serverSelected?.id !== selectedId) {
            setSelectedId(serverSelected?.id ?? null);
        }
    }, [serverSelected]);

    const toggleSelect = (id: string) => {
        setSelectedAssets((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < MAX_BULK) {
                next.add(id);
            } else {
                toast.warning(`Maksimal ${MAX_BULK} aset dapat dipilih.`);
                return prev;
            }
            return next;
});
        });

        const toggleSelectAll = () => {
            const pageIdsToAdd = allSelected ? [] : pageIds;
            const availableSlots = MAX_BULK - selectedAssets.size;
            const toAdd = pageIdsToAdd.slice(0, Math.max(0, availableSlots));

            if (toAdd.length < pageIdsToAdd.length) {
                toast.warning(`Maksimal ${MAX_BULK} aset dapat dipilih; menampilkan ${availableSlots}.`);
            }

            setSelectedAssets((prev) => {
                const next = new Set(prev);
                if (allSelected) {
                    for (const id of pageIds) next.delete(id);
                } else {
                    for (const id of toAdd) next.add(id);
                }
                return next;
            });
        };

    const handleDelete = () => {
        if (!deleting) return;
        setDeletingState(true);
        router.delete(`/assets/${deleting.id}`, {
            only: ['assets'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeletingState(false);
                setDeleting(null);
                toast.success('Aset berhasil dihapus.');
            },
            onError: () => {
                setDeletingState(false);
                toast.error('Gagal menghapus aset.');
            },
        });
    };

    const confirmBulkDelete = () => {
        if (selectedAssets.size === 0) return;
        setBulkDeleting(true);
        const ids = Array.from(selectedAssets);
        router.delete('/assets/bulk', {
            data: { ids },
            only: ['assets'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setBulkDeleting(false);
                setBulkDeleteOpen(false);
                setSelectedAssets(new Set());
                toast.success(`${ids.length} aset berhasil dihapus.`);
            },
            onError: () => {
                setBulkDeleting(false);
                toast.error('Gagal menghapus aset terpilih.');
            },
        });
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, replace: true });
    };

    const reload = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {};
        if (selectedId) {
            const selectedNode = selected;
            if (selectedNode) {
                params.level = selectedNode.level;
                params.node = selectedNode.id;
            }
        }
        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;

        router.get(
            '/assets/browse',
            { ...params, ...overrides },
            { preserveState: true, replace: true, only: ['assets', 'selected', 'breadcrumb'] },
        );
    };

    const applyFilters = () => {
        setFilterOpen(false);
        reload({});
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setFilterOpen(false);
        reload({ search: '', status: '' });
    };

    const activeFilterCount = [search, statusFilter].filter(Boolean).length;

    const handleNodeSelect = (id: string) => {
        setSelectedId(id);
        const node = findNode(tree, id);
        if (node) {
            const level: ClassificationLevel = ['group', 'category', 'cluster', 'sub-cluster'][getNodeDepth(tree, id)];
            router.get(
                '/assets/browse',
                { level, node: id },
                { preserveState: true, replace: true, only: ['assets', 'selected', 'breadcrumb'] },
            );
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div
            className={cn(
                'relative flex min-h-[100dvh] flex-col p-4 sm:p-6 lg:p-8',
                selected.size > 0 && 'pb-32 lg:pb-8',
            )}
        >
            <VibrantBackground variant="default" />
            <div className="mx-auto w-full max-w-7xl">
                <div
                    className={cn(
                        'ease-premium relative transition-all duration-200',
                        isProcessing && 'pointer-events-none opacity-60',
                    )}
                >
                    {isProcessing && (
                        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                            <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg">
                                <Spinner className="size-4" />
                                Memproses...
                            </div>
                        </div>
                    )}

                    <div className="card-enter flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="glass-card flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10 sm:size-12">
                                <Boxes className="size-5 sm:size-6" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    Telusuri Aset
                                </h1>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                                    Jelajahi hierarki klasifikasi untuk menemukan aset.
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Link href={withReturnTo('/assets/create')}>
                                <Button
                                    size="sm"
                                    className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                                >
                                    <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                        <Plus className="size-3.5" strokeWidth={2.25} />
                                    </span>
                                    Tambah Aset
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="card-enter mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] lg:[&>*]:min-h-0">
                        {/* Left Pane: Classification Tree */}
                        <section className="glass-panel card-enter flex min-h-[500px] flex-col delay-100 lg:h-[calc(100dvh-14rem)]">
                            <div className="relative overflow-hidden border-b border-border/60 px-4 py-3">
                                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent dark:from-primary/[0.1]" />
                                <div className="relative flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-sm font-semibold text-foreground">Struktur Klasifikasi</h2>
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                            {tree.length} golongan
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground transition-colors duration-200 hover:bg-muted/80 hover:text-foreground"
                                            onClick={() => setExpandedIds(
                                                new Set(
                                                    (() => {
                                                        const all = new Set<string>();
                                                        const walk = (nodes: BrowseTreeNode[]) => {
                                                            for (const node of nodes) {
                                                                if (node.children && node.children.length > 0) {
                                                                    all.add(node.id);
                                                                    walk(node.children);
                                                                }
                                                            }
                                                        };
                                                        walk(tree);
                                                        return all;
                                                    })(),
                                                ),
                                            )}
                                            aria-label="Perluas semua"
                                        >
                                            <ChevronRight className="size-4 rotate-90" strokeWidth={1.75} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground transition-colors duration-200 hover:bg-muted/80 hover:text-foreground"
                                            onClick={() => setExpandedIds(new Set())}
                                            aria-label="Ciutkan semua"
                                        >
                                            <ChevronRight className="size-4" strokeWidth={1.75} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-border/60 px-3 py-2.5">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari kode atau nama..."
                                        className="h-8 rounded-lg border-border/60 bg-background/80 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20"
                                        value={''}
                                        onChange={() => {}}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2" role="tree" aria-label="Klasifikasi Asset">
                                {tree.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Boxes className="size-7" strokeWidth={1.25} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Belum ada golongan asset</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Buat yang pertama untuk memulai hierarki klasifikasi.</p>
                                        </div>
                                    </div>
                                ) : (
                                    tree.map((node) => (
                                        <BrowseTreeNodeRow
                                            key={node.id}
                                            node={node}
                                            depth={0}
                                            selectedId={selectedId}
                                            expandedIds={expandedIds}
                                            onSelect={handleNodeSelect}
                                            onToggleExpand={toggleExpand}
                                        />
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Right Pane: Asset Grid */}
                        <section className="glass-panel card-enter flex min-h-[500px] flex-col delay-150 lg:h-[calc(100dvh-14rem)]">
                            <div className="flex min-h-[500px] flex-col overflow-hidden rounded-[0.75rem] lg:h-full">
                                {!selectedId ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Layers className="size-7" strokeWidth={1.25} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-foreground">Pilih node dari pohon</h2>
                                            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                                Klik golongan, kategori, cluster, atau sub cluster untuk melihat aset di dalamnya.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {breadcrumb.length > 0 && (
                                            <div className="border-b border-border/60 px-4 py-3">
                                                <nav className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Jalur klasifikasi">
                                                    {breadcrumb.map((crumb, index) => (
                                                        <Link
                                                            key={crumb.id}
                                                            href={`/assets/browse?level=${crumb.level}&node=${crumb.id}`}
                                                            className={cn(
                                                                'inline-flex items-center rounded px-1.5 py-0.5 transition-colors',
                                                                LEVEL_TINTS[crumb.level].bg,
                                                                LEVEL_TINTS[crumb.level].fg,
                                                                index === breadcrumb.length - 1 && 'font-semibold',
                                                            )}
                                                        >
                                                            {crumb.name}
                                                            {crumb.code && (
                                                                <span className="ml-1 font-mono text-[10px] opacity-70">
                                                                    {crumb.code}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    ))}
                                                </nav>
                                            </div>
                                        )}

                                        <div className="border-b border-border/60 px-4 py-3">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        Aset di {breadcrumb[breadcrumb.length - 1]?.name ?? 'Node'}
                                                    </h3>
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                                        {assets?.total ?? 0} aset
                                                    </span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setFilterOpen(true)}
                                                        className="h-10! flex-1 rounded-xl border-border/70 bg-card/70 px-4 text-sm font-medium shadow-sm backdrop-blur-xl sm:h-11! sm:flex-none"
                                                    >
                                                        <Filter className="size-4" />
                                                        Filter
                                                        {activeFilterCount > 0 && (
                                                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                                                                {activeFilterCount}
                                                            </span>
                                                        )}
                                                    </Button>

                                                    {activeFilterCount > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={clearFilters}
                                                            className="size-10! shrink-0 rounded-xl sm:size-9!"
                                                            aria-label="Hapus semua filter"
                                                            title="Hapus semua filter"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {assets?.data.length === 0 ? (
                                            <EmptyState
                                                icon={Package}
                                                title={
                                                    activeFilterCount > 0
                                                        ? 'Tidak ada hasil filter'
                                                        : 'Tidak ada aset di node ini'
                                                }
                                                description={
                                                    activeFilterCount > 0
                                                        ? 'Tidak ditemukan aset dengan filter tersebut. Coba kata kunci lain.'
                                                        : 'Node ini belum memiliki aset. Tambahkan aset dari halaman Daftar Aset.'
                                                }
                                            />
                                        ) : (
                                            <div className="flex-1 overflow-y-auto p-4">
                                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                    {assets.data.map((asset) => (
                                                        <AssetCard
                                                            key={asset.id}
                                                            asset={asset}
                                                            selected={selected.has(asset.id)}
                                                            onSelect={() => toggleSelect(asset.id)}
                                                            onDelete={() => setDeleting(asset)}
                                                            onEdit={() => {}}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {assets && assets.last_page > 1 && (
                                    <div className="border-t border-border/60 px-4 py-3">
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
                        </section>
                    </div>
                </div>
            </div>

            {selected.size > 0 && (
                <div
                    role="toolbar"
                    aria-label="Aksi massal aset"
                    className={cn(
                        'card-enter fixed inset-x-3 z-40 flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-background/90 p-2 shadow-2xl backdrop-blur-xl',
                        'bottom-[calc(4rem+env(safe-area-inset-bottom))]',
                        'sm:p-2.5 lg:sticky lg:inset-x-auto lg:bottom-6 lg:mx-auto lg:w-fit',
                    )}
                >
                    <p className="flex min-w-0 items-center gap-2 pl-1.5 text-sm font-semibold text-foreground">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                            {selected.size}
                        </span>
                        <span className="truncate">
                            dipilih
                            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
                                {' '}· maks {MAX_BULK}
                            </span>
                        </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl sm:size-9"
                            onClick={() => setSelected(new Set())}
                            aria-label="Batalkan pilihan"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive sm:size-9"
                            onClick={() => setBulkDeleteOpen(true)}
                            aria-label="Hapus aset terpilih"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog
                open={bulkDeleteOpen}
                onOpenChange={(open) => !bulkDeleting && setBulkDeleteOpen(open)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Aset Terpilih</DialogTitle>
                        <DialogDescription>
                            Hapus{' '}
                            <span className="font-semibold text-foreground">{selected.size}</span>{' '}
                            aset yang dipilih? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleting}>
                            {bulkDeleting && <Spinner className="mr-2 size-4" />}
                            Hapus {selected.size} Aset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Aset</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus aset{' '}
                            <span className="font-semibold text-foreground">{deleting?.kode_asset ?? ''}</span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={deletingState}>
                            {deletingState && <Spinner className="mr-2 size-4" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent className="glass-panel ease-out-[cubic-bezier(0.16,1,0.3,1)] animate-in border-border/30 bg-background/85 shadow-2xl backdrop-blur-xl duration-200 zoom-in-95 fade-in sm:max-w-lg">
                    <DialogHeader className="border-b border-border/20 pb-3">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                            <Filter className="size-5 text-primary" strokeWidth={2} />
                            Filter Aset
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm text-muted-foreground">Persempit daftar aset berdasarkan kriteria berikut.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Status Aset</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-10 border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel overflow-hidden rounded-xl border-border/30 bg-background/90 p-1 shadow-2xl backdrop-blur-xl">
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 focus:bg-primary/5">
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">Pencarian</Label>
                            <Input
                                placeholder="Cari kode, serial, brand, model..."
                                className="h-10! rounded-xl border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-3 border-t border-border/20 pt-4 sm:justify-between">
                        <Button type="button" variant="ghost" onClick={clearFilters} className="h-10 gap-2 px-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground">
                            <Trash2 className="size-4" strokeWidth={2} /> Reset
                        </Button>
                        <Button type="button" onClick={applyFilters} className="h-10 gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]">
                            <Filter className="size-4" strokeWidth={2} /> Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper functions
function findNode(nodes: BrowseTreeNode[], id: string): BrowseTreeNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children ?? [], id);
        if (found) return found;
    }
    return null;
}

function getNodeDepth(nodes: BrowseTreeNode[], id: string, depth = 0): number {
    for (const node of nodes) {
        if (node.id === id) return depth;
        const found = getNodeDepth(node.children ?? [], id, depth + 1);
        if (found !== -1) return found;
    }
    return -1;
}

function AssetCard({
    asset,
    selected,
    onSelect,
    onDelete,
    onEdit,
}: {
    asset: Asset;
    selected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const chain = [
        asset.asset_group,
        asset.asset_category,
        asset.asset_cluster,
        asset.asset_sub_cluster,
    ].filter(Boolean) as Array<{ id: string; code: string | null; name: string }>;

    return (
        <div
            className={cn(
                'glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]',
                selected && 'ring-2 ring-primary/50 bg-primary/5',
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
                                    <Package className="size-5" strokeWidth={1.75} />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <Link
                                href={`/assets/${asset.id}`}
                                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                                {asset.item?.name ?? 'Aset'}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {[asset.brand, asset.model].filter(Boolean).join(' · ') || '—'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Link href={withReturnTo(`/assets/${asset.id}/edit`)}>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Edit aset">
                            <Package className="size-3.5" strokeWidth={2} />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="size-8" onClick={onDelete} aria-label="Hapus aset">
                        <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                <span className="truncate font-mono text-xs font-bold text-primary tabular-nums">
                    {asset.kode_asset ?? '—'}
                </span>
                <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1', assetStatusChip(asset.status))}>
                    <span className={cn('size-1.5 rounded-full', assetStatusDot(asset.status))} />
                    {assetStatusLabel(asset.status)}
                </span>
            </div>

            <div className="relative mt-3.5 flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1">
                    {chain.length > 0 ? (
                        chain.map((level, index) => (
                            <span key={`${level.id}-${index}`} className="inline-flex items-center">
                                {index > 0 && <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />}
                                <span className="inline-flex max-w-40 items-center gap-1 truncate rounded-md px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/70">
                                    <span className="truncate">{level.name}</span>
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-muted-foreground">Belum ada klasifikasi</span>
                    )}
                </div>

                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {asset.item && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Package className="size-3.5 shrink-0" strokeWidth={2} />
                            <span className="truncate">{asset.item.name}</span>
                        </p>
                    )}
                    {asset.serial_number && (
                        <p className="flex items-center gap-1.5 truncate font-mono text-muted-foreground">
                            <Package className="size-3.5 shrink-0" strokeWidth={2} />
                            <span className="truncate">{asset.serial_number}</span>
                        </p>
                    )}
                    {asset.document_url?.length > 0 && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Package className="size-3.5 shrink-0" strokeWidth={2} />
                            <span>{asset.document_url.length} dokumen</span>
                        </p>
                    )}
                    {asset.location && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
                            <span className="truncate">{asset.location.name}</span>
                        </p>
                    )}
                    {asset.department && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Building2 className="size-3.5 shrink-0" strokeWidth={2} />
                            <span className="truncate">{asset.department.nama_department}</span>
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1', conditionAccent(asset.condition))}>
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

AssetsBrowse.layout = {
    breadcrumbs: [
        { title: 'Telusuri Aset', href: '/assets/browse' },
    ],
};