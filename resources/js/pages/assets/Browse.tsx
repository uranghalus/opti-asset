import { Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Boxes,
    ChevronDown,
    ChevronRight,
    FileText,
    Filter,
    FolderTree,
    Inbox,
    MapPin,
    Package,
    Pencil,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { ResourcePagination } from '@/components/resource-pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { rememberAssetListUrl, withReturnTo } from '@/lib/asset-return';
import {
    ASSET_STATUSES,
    assetStatusChip,
    assetStatusDot,
    assetStatusLabel,
} from '@/lib/asset-status';
import { LevelIcon, LEVEL_SHORT } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { browse, destroy, edit, show } from '@/routes/assets';
import type {
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { LEVEL_LABELS } from '@/types/classification';

type Classification = {
    id: string;
    code: string | null;
    name: string;
    asset_group_id?: string;
    asset_category_id?: string;
    asset_cluster_id?: string;
};

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
    asset_group: Classification | null;
    asset_category: Classification | null;
    asset_cluster: Classification | null;
    asset_sub_cluster: Classification | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };
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
    tree: ClassificationNode[];
    assets: PaginatedData<Asset>;
    selectedNode: string | null;
    selectedLevel: ClassificationLevel | null;
    breadcrumb: { id: string; name: string; level: ClassificationLevel }[];
    filters: { search: string; status: string; department: string };
    departments: { id_department: string; nama_department: string }[];
};

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    ...ASSET_STATUSES.map(({ value, label }) => ({ value, label })),
];

function formatDate(value: string | null): string {
    return value
        ? new Date(value).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : 'ÔÇö';
}

function conditionAccent(condition: string | null): string {
    return condition === 'Baik'
        ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
        : condition === 'Rusak Ringan'
          ? 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300'
          : condition === 'Rusak Berat'
            ? 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300'
            : 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300';
}

function filterNodes(
    nodes: ClassificationNode[],
    query: string,
): ClassificationNode[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return nodes;

    return nodes.reduce<ClassificationNode[]>((result, node) => {
        const children = filterNodes(node.children ?? [], normalized);
        if (
            node.name.toLowerCase().includes(normalized) ||
            node.code?.toLowerCase().includes(normalized) ||
            children.length
        ) {
            result.push(children.length ? { ...node, children } : node);
        }
        return result;
    }, []);
}

function ancestorIds(nodes: ClassificationNode[], ids: string[]): Set<string> {
    const expanded = new Set<string>();
    const walk = (items: ClassificationNode[], trail: string[]) => {
        items.forEach((node) => {
            if (ids.includes(node.id)) {
                trail.forEach((id) => expanded.add(id));
                if (node.children?.length) expanded.add(node.id);
            }
            walk(node.children ?? [], [...trail, node.id]);
        });
    };
    walk(nodes, []);
    return expanded;
}

export default function Browse() {
    const { tree, assets, selectedNode, breadcrumb, filters, departments } =
        usePage().props as unknown as PageProps;
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(() =>
        ancestorIds(
            tree,
            breadcrumb.map((crumb) => crumb.id),
        ),
    );
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [department, setDepartment] = useState(filters.department);
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();
    const visibleTree = useMemo(() => filterNodes(tree, query), [tree, query]);

    useEffect(() => rememberAssetListUrl(), []);
    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const load = (values: {
        search?: string;
        status?: string;
        department?: string;
        node?: string | null;
    }) => {
        router.get(
            browse().url,
            {
                node: values.node === undefined ? selectedNode : values.node,
                search: values.search ?? search,
                status: values.status ?? status,
                department: values.department ?? department,
            },
            {
                preserveState: true,
                replace: true,
                only: [
                    'assets',
                    'filters',
                    'breadcrumb',
                    'selectedNode',
                    'selectedLevel',
                ],
            },
        );
    };
    const navigateNode = (id: string, hasChildren: boolean) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (hasChildren) next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        load({ node: id });
    };
    const clear = () => {
        setSearch('');
        setStatus('');
        setDepartment('');
        load({ node: null, search: '', status: '', department: '' });
    };
    const handleDelete = () => {
        if (!deleting) return;
        setDeletingState(true);
        router.delete(destroy(deleting.id).url, {
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
    const goToPage = (url: string | null) =>
        url && router.get(url, {}, { preserveState: true, replace: true });
    const active = Boolean(selectedNode || search || status || department);

    const treePanel = (
        <div className="glass-panel rounded-2xl p-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-foreground">
                        Klasifikasi Aset
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {tree.length} golongan
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => {
                            const ids = new Set<string>();
                            const walk = (nodes: ClassificationNode[]) =>
                                nodes.forEach((node) => {
                                    if (node.children?.length) {
                                        ids.add(node.id);
                                        walk(node.children);
                                    }
                                });
                            walk(tree);
                            setExpanded(ids);
                        }}
                        aria-label="Buka semua"
                    >
                        <ChevronDown className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => setExpanded(new Set())}
                        aria-label="Tutup semua"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
            <div className="group relative mt-4">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari klasifikasi..."
                    className="h-10 rounded-xl bg-card/60 pl-9"
                />
            </div>
            <div className="mt-4 space-y-1">
                {visibleTree.map((node) => (
                    <TreeRow
                        key={node.id}
                        node={node}
                        depth={0}
                        expanded={expanded}
                        selectedNode={selectedNode}
                        query={query}
                        onNavigate={navigateNode}
                        onToggle={(id) =>
                            setExpanded((previous) => {
                                const next = new Set(previous);
                                next.has(id) ? next.delete(id) : next.add(id);
                                return next;
                            })
                        }
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative min-h-[100dvh] p-4 sm:p-6 lg:p-8">
            <VibrantBackground variant="default" />
            <div className="relative mx-auto w-full max-w-7xl">
                <header className="card-enter flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="glass-card flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary">
                            <FolderTree className="size-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                Telusuri Aset
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Jelajahi aset melalui hierarki klasifikasi.
                            </p>
                        </div>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="rounded-xl lg:hidden"
                            >
                                <SlidersHorizontal className="size-4" />
                                Telusuri
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-[min(90vw,380px)] bg-background/90 p-4 backdrop-blur-xl"
                        >
                            <SheetHeader className="p-0">
                                <SheetTitle>Telusuri klasifikasi</SheetTitle>
                            </SheetHeader>
                            {treePanel}
                        </SheetContent>
                    </Sheet>
                </header>
                <div
                    className={cn(
                        'mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]',
                        isProcessing && 'pointer-events-none opacity-60',
                    )}
                >
                    <aside className="hidden lg:block">{treePanel}</aside>
                    <main className="min-w-0">
                        <nav className="glass-panel flex flex-wrap items-center gap-1.5 rounded-2xl px-4 py-3 text-sm">
                            <button
                                type="button"
                                className="font-semibold text-primary hover:underline"
                                onClick={() => load({ node: null })}
                            >
                                Semua Aset
                            </button>
                            {breadcrumb.map((crumb) => (
                                <span
                                    key={crumb.id}
                                    className="inline-flex items-center gap-1.5"
                                >
                                    <ChevronRight className="size-3.5 text-muted-foreground/60" />
                                    <button
                                        type="button"
                                        className={cn(
                                            'max-w-40 truncate hover:text-primary hover:underline',
                                            crumb.id === selectedNode &&
                                                'font-semibold text-primary',
                                        )}
                                        onClick={() => load({ node: crumb.id })}
                                    >
                                        {crumb.name}
                                    </button>
                                </span>
                            ))}
                            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                <Boxes className="size-3.5" />
                                {assets.total}
                            </span>
                        </nav>
                        <section className="glass-panel mt-4 flex flex-col gap-2.5 rounded-2xl p-3 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSearch(value);
                                        if (timer.current)
                                            clearTimeout(timer.current);
                                        timer.current = setTimeout(
                                            () => load({ search: value }),
                                            350,
                                        );
                                    }}
                                    placeholder="Cari kode, serial, brand, model..."
                                    className="h-11 rounded-xl bg-card/70 pr-10 pl-10"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            load({ search: '' });
                                        }}
                                        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-card"
                                        aria-label="Bersihkan pencarian"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    load({ status: value });
                                }}
                            >
                                <SelectTrigger className="h-11 w-full rounded-xl bg-card/70 sm:w-40">
                                    <Filter className="size-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value || 'all'}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={department}
                                onValueChange={(value) => {
                                    setDepartment(value);
                                    load({ department: value });
                                }}
                            >
                                <SelectTrigger className="h-11 w-full rounded-xl bg-card/70 sm:w-48">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        Semua Department
                                    </SelectItem>
                                    {departments.map((item) => (
                                        <SelectItem
                                            key={item.id_department}
                                            value={item.id_department}
                                        >
                                            {item.nama_department}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {active && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clear}
                                    className="size-11 shrink-0 rounded-xl"
                                    aria-label="Hapus filter"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </section>
                        {assets.data.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title="Tidak ada aset"
                                description="Tidak ditemukan aset pada klasifikasi atau filter tersebut."
                            />
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {assets.data.map((asset) => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onDelete={setDeleting}
                                    />
                                ))}
                            </div>
                        )}
                        {assets.last_page > 1 && (
                            <ResourcePagination
                                links={assets.links}
                                currentPage={assets.current_page}
                                lastPage={assets.last_page}
                                from={assets.from}
                                to={assets.to}
                                total={assets.total}
                                onPageChange={goToPage}
                            />
                        )}
                    </main>
                </div>
            </div>
            <Dialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus aset?</DialogTitle>
                        <DialogDescription>
                            Aset{' '}
                            {deleting?.kode_asset ?? deleting?.item?.name ?? ''}{' '}
                            akan dihapus permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletingState}
                        >
                            {deletingState ? 'Menghapus...' : 'Hapus aset'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TreeRow({
    node,
    depth,
    expanded,
    selectedNode,
    query,
    onNavigate,
    onToggle,
}: {
    node: ClassificationNode;
    depth: number;
    expanded: Set<string>;
    selectedNode: string | null;
    query: string;
    onNavigate: (id: string, hasChildren: boolean) => void;
    onToggle: (id: string) => void;
}) {
    const level = (
        ['group', 'category', 'cluster', 'sub-cluster'] as ClassificationLevel[]
    )[Math.min(depth, 3)];
    const children = node.children ?? [];
    const hasChildren = node.child_count > 0 || children.length > 0;
    const match =
        query &&
        (node.name.toLowerCase().includes(query.toLowerCase()) ||
            node.code?.toLowerCase().includes(query.toLowerCase()));
    return (
        <div>
            <div
                className={cn(
                    'group flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-primary/5',
                    selectedNode === node.id &&
                        'bg-primary/10 ring-1 ring-primary/25',
                )}
                style={{ paddingLeft: `${8 + depth * 20}px` }}
                onClick={() => onNavigate(node.id, hasChildren)}
            >
                <button
                    type="button"
                    className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
                    onClick={(event) => {
                        event.stopPropagation();
                        hasChildren && onToggle(node.id);
                    }}
                    aria-label={expanded.has(node.id) ? 'Tutup' : 'Buka'}
                >
                    {hasChildren ? (
                        expanded.has(node.id) ? (
                            <ChevronDown className="size-3.5" />
                        ) : (
                            <ChevronRight className="size-3.5" />
                        )
                    ) : null}
                </button>
                <LevelIcon
                    level={level}
                    open={expanded.has(node.id)}
                    size="sm"
                />
                <span
                    className={cn(
                        'min-w-0 flex-1 truncate text-sm',
                        match && 'font-semibold text-primary',
                    )}
                    title={LEVEL_LABELS[level]}
                >
                    {node.name}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                        {LEVEL_SHORT[level]}
                    </span>
                    {node.code && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">
                            ┬À {node.code}
                        </span>
                    )}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tabular-nums">
                    {node.asset_count ?? 0}
                </span>
            </div>
            {expanded.has(node.id) &&
                children.map((child) => (
                    <TreeRow
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        expanded={expanded}
                        selectedNode={selectedNode}
                        query={query}
                        onNavigate={onNavigate}
                        onToggle={onToggle}
                    />
                ))}
        </div>
    );
}

function AssetCard({
    asset,
    onDelete,
}: {
    asset: Asset;
    onDelete: (asset: Asset) => void;
}) {
    const chain = [
        asset.asset_group,
        asset.asset_category,
        asset.asset_cluster,
        asset.asset_sub_cluster,
    ].filter(Boolean) as Classification[];
    return (
        <div className="glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between gap-3">
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
                                    <span className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-background px-1 text-xs font-bold text-muted-foreground shadow-sm">
                                        +{asset.photo_url.length - 1}
                                    </span>
                                )}
                            </>
                        ) : (
                            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Package className="size-5" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={show(asset.id).url}
                            className="block truncate text-sm font-semibold hover:text-primary"
                        >
                            {asset.item?.name ?? 'Aset'}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {[asset.brand, asset.model]
                                .filter(Boolean)
                                .join(' ┬À ') || 'ÔÇö'}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Link href={withReturnTo(edit(asset.id).url)}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Edit aset"
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onDelete(asset)}
                        aria-label="Hapus aset"
                    >
                        <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                <span className="truncate font-mono text-xs font-bold text-primary">
                    {asset.kode_asset ?? 'ÔÇö'}
                </span>
                <span
                    className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold uppercase ring-1',
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
                    {chain.length ? (
                        chain.map((level, index) => (
                            <span
                                key={`${level.id}-${index}`}
                                className="inline-flex items-center"
                            >
                                {index > 0 && (
                                    <ChevronRight className="size-3 text-muted-foreground/50" />
                                )}
                                <span className="max-w-40 truncate rounded-md px-2 py-0.5 text-xs font-semibold text-muted-foreground ring-1 ring-border/70">
                                    {level.name}
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Belum ada klasifikasi
                        </span>
                    )}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {asset.item && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Package className="size-3.5 shrink-0" />
                            {asset.item.name}
                        </p>
                    )}
                    {asset.serial_number && (
                        <p className="flex items-center gap-1.5 truncate font-mono text-muted-foreground">
                            <FileText className="size-3.5 shrink-0" />
                            {asset.serial_number}
                        </p>
                    )}
                    {asset.document_url?.length > 0 && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <FileText className="size-3.5 shrink-0" />
                            {asset.document_url.length} dokumen
                        </p>
                    )}
                    {asset.location && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            {asset.location.name}
                        </p>
                    )}
                    {asset.department && (
                        <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                            <Building2 className="size-3.5 shrink-0" />
                            {asset.department.nama_department}
                        </p>
                    )}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1',
                            conditionAccent(asset.condition),
                        )}
                    >
                        {asset.condition ?? 'ÔÇö'}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(asset.created_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}
