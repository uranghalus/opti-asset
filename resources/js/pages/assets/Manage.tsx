import { Link, router, usePage } from '@inertiajs/react';
import {
    Barcode,
    Boxes,
    Building2,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    FolderOpen,
    Inbox,
    Layers,
    MapPin,
    MoreHorizontal,
    Package,
    Pencil,
    Plus,
    ScanLine,
    Search,
    SlidersHorizontal,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { LEVEL_TINTS, LevelIcon } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import {
    create,
    destroy,
    destroyBulk,
    edit,
    index,
    importMethod,
    importTemplate,
    labels as labelsRoute,
    labelsBatch,
    scan,
    show,
} from '@/routes/assets';
import type {
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { CHILD_LABELS } from '@/types/classification';

type Asset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    status: string;
    condition: string | null;
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
type BrowseNode = ClassificationNode & { children?: BrowseNode[] };
type PageProps = {
    tree: BrowseNode[];
    selected: { level: ClassificationLevel; id: string } | null;
    breadcrumb: Array<{
        id: string;
        level: ClassificationLevel;
        code: string | null;
        name: string;
    }>;
    assets: PaginatedData<Asset> | null;
    groups: Array<{ id: string; code: string | null; name: string }>;
    categories: Array<{
        id: string;
        code: string | null;
        name: string;
        asset_group_id: string;
    }>;
    items: Array<{
        id: string;
        code: string;
        name: string;
        category_code: string | null;
    }>;
    locations: Array<{ id: string; name: string }>;
    departments: Array<{ id_department: string; nama_department: string }>;
    filters: {
        search: string;
        status: string;
        department: string;
        condition: string;
        level: string;
        node: string;
        initialLevel: string;
    };
};

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    ...ASSET_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];
const CONDITION_OPTIONS = [
    { value: '', label: 'Semua Kondisi' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
];
const MAX_BULK = 100;
const LEVEL_DEPTH: Record<ClassificationLevel, number> = {
    group: 0,
    category: 1,
    cluster: 2,
    'sub-cluster': 3,
};

function findNode(nodes: BrowseNode[], id: string | null): BrowseNode | null {
    if (!id) return null;
    for (const n of nodes) {
        if (n.id === id) return n;
        const c = findNode(n.children ?? [], id);
        if (c) return c;
    }
    return null;
}
function filterTree(nodes: BrowseNode[], search: string): BrowseNode[] {
    if (!search.trim()) return nodes;
    const t = search.toLowerCase().trim();
    return nodes
        .filter(
            (n) =>
                n.name.toLowerCase().includes(t) ||
                (n.code?.toLowerCase().includes(t) ?? false) ||
                filterTree(n.children ?? [], search).length > 0,
        )
        .map((n) => ({
            ...n,
            children: n.children ? filterTree(n.children, search) : undefined,
        }));
}

function TreeRow({
    node,
    selectedId,
    onSelect,
}: {
    node: BrowseNode;
    selectedId: string | null;
    onSelect: (n: BrowseNode) => void;
}) {
    const isSel = selectedId === node.id;
    const tint = LEVEL_TINTS[node.level];
    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            role="treeitem"
            aria-selected={isSel}
            className={cn(
                'group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
                isSel
                    ? 'bg-primary/10 font-medium text-primary ring-1 ring-primary/15'
                    : 'text-foreground hover:bg-muted/60',
            )}
            style={{ paddingLeft: `${LEVEL_DEPTH[node.level] * 12 + 8}px` }}
        >
            <LevelIcon level={node.level} size="sm" />
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {node.code && (
                <span
                    className={cn(
                        'shrink-0 rounded px-1 py-0.5 font-mono text-[10px]',
                        tint.bg,
                        tint.fg,
                    )}
                >
                    {node.code}
                </span>
            )}
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {node.asset_count ?? 0}
            </span>
        </button>
    );
}

function LedgerRow({
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
                'group flex items-center gap-3 border-b border-border/40 bg-card/40 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50',
                selected && 'bg-primary/5',
            )}
        >
            <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
            />
            <span className="w-[140px] shrink-0 truncate font-mono text-xs font-semibold text-primary tabular-nums">
                {asset.kode_asset ?? '—'}
            </span>
            <span className="min-w-0 flex-1 truncate">
                <span className="font-medium text-foreground">
                    {asset.item?.name ?? '—'}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                    {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                </span>
                <span className="ml-2 hidden items-center gap-1 text-[11px] text-muted-foreground lg:inline-flex">
                    {chain.map((c, i) => (
                        <span
                            key={c.id}
                            className="inline-flex items-center gap-1"
                        >
                            {i > 0 && (
                                <ChevronRight className="size-3 opacity-40" />
                            )}
                            {c.code ?? c.name}
                        </span>
                    ))}
                </span>
            </span>
            <span
                className={cn(
                    'hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 sm:inline-flex',
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
            <span className="hidden w-[90px] shrink-0 truncate text-xs text-muted-foreground lg:block">
                {asset.location?.name ?? '—'}
            </span>
            <span className="hidden w-[90px] shrink-0 truncate text-xs text-muted-foreground lg:block">
                {asset.department?.nama_department ?? '—'}
            </span>
            <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link href={withReturnTo(show.url({ asset: asset.id }))}>
                    <Button variant="ghost" size="icon" className="size-7">
                        <FileText className="size-3.5" />
                    </Button>
                </Link>
                <Link href={withReturnTo(edit.url({ asset: asset.id }))}>
                    <Button variant="ghost" size="icon" className="size-7">
                        <Pencil className="size-3.5" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={onDelete}
                    aria-label="Hapus"
                >
                    <Trash2 className="size-3.5 text-destructive" />
                </Button>
            </span>
        </div>
    );
}

function FolderChip({
    node,
    onSelect,
}: {
    node: BrowseNode;
    onSelect: (n: BrowseNode) => void;
}) {
    const tint = LEVEL_TINTS[node.level];
    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors hover:shadow-sm',
                'border-border/60 bg-card/60',
                tint.bg,
            )}
        >
            <LevelIcon level={node.level} size="sm" />
            <span className="font-medium">{node.name}</span>
            {node.code && (
                <span className="font-mono text-xs opacity-60">
                    {node.code}
                </span>
            )}
            <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums">
                {node.asset_count ?? 0} aset · {node.child_count}{' '}
                {node.level === 'sub-cluster'
                    ? ''
                    : CHILD_LABELS[
                          node.level as Exclude<
                              ClassificationLevel,
                              'sub-cluster'
                          >
                      ]}
            </span>
        </button>
    );
}

export default function Manage() {
    const {
        tree,
        selected: serverSelected,
        breadcrumb,
        assets,
        departments,
        filters,
    } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [departmentFilter, setDepartmentFilter] = useState(
        filters.department,
    );
    const [conditionFilter, setConditionFilter] = useState(filters.condition);
    const [filterOpen, setFilterOpen] = useState(false);
    const [treeSearch, setTreeSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(
        serverSelected?.id ?? null,
    );
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importItemId, setImportItemId] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    useEffect(() => {
        if (serverSelected?.id !== selectedId)
            setSelectedId(serverSelected?.id ?? null);
    }, [serverSelected, selectedId]);
    useEffect(() => rememberAssetListUrl(), []);
    useEffect(
        () => () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        },
        [],
    );

    const safeAssets: PaginatedData<Asset> = assets ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    };
    const selectedNode = findNode(tree, selectedId);
    const childFolders: BrowseNode[] = selectedNode
        ? (selectedNode.children ?? [])
        : tree;
    const visibleFolders = treeSearch.trim()
        ? filterTree(childFolders, treeSearch)
        : childFolders;

    const navigate = (params: Record<string, string>) => {
        router.get(
            index.url({ query: params }),
            {},
            {
                preserveState: true,
                replace: true,
                only: ['tree', 'selected', 'breadcrumb', 'assets', 'filters'],
            },
        );
    };
    const currentParams = (): Record<string, string> => {
        const p: Record<string, string> = {};
        if (selectedId && serverSelected) {
            p.level = serverSelected.level;
            p.node = serverSelected.id;
        } else if (filters.level && filters.node) {
            p.level = filters.level;
            p.node = filters.node;
        }
        if (search.trim()) p.search = search.trim();
        if (statusFilter) p.status = statusFilter;
        if (departmentFilter) p.department = departmentFilter;
        if (conditionFilter) p.condition = conditionFilter;
        return p;
    };
    const handleNodeSelect = (node: BrowseNode) => {
        setSelectedId(node.id);
        setDrawerOpen(false);
        const p: Record<string, string> = { level: node.level, node: node.id };
        if (search.trim()) p.search = search.trim();
        if (statusFilter) p.status = statusFilter;
        if (departmentFilter) p.department = departmentFilter;
        if (conditionFilter) p.condition = conditionFilter;
        navigate(p);
    };
    const clearNode = () => {
        setSelectedId(null);
        const p: Record<string, string> = {};
        if (search.trim()) p.search = search.trim();
        if (statusFilter) p.status = statusFilter;
        if (departmentFilter) p.department = departmentFilter;
        if (conditionFilter) p.condition = conditionFilter;
        navigate(p);
    };
    const reload = (overrides: Record<string, string>) =>
        navigate({ ...currentParams(), ...overrides });
    const applyFilters = () => {
        setFilterOpen(false);
        reload({});
    };
    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setDepartmentFilter('');
        setConditionFilter('');
        setFilterOpen(false);
        navigate(
            selectedId && serverSelected
                ? { level: serverSelected.level, node: serverSelected.id }
                : {},
        );
    };
    const activeFilterCount =
        [statusFilter, departmentFilter, conditionFilter].filter(Boolean)
            .length +
        (search ? 1 : 0) +
        (selectedId ? 1 : 0);
    const toggleSelect = (id: string) =>
        setSelected((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else if (n.size < MAX_BULK) n.add(id);
            else toast.warning(`Maksimal ${MAX_BULK} aset.`);
            return n;
        });
    const pageIds = safeAssets.data.map((a) => a.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const toggleSelectAll = () => {
        if (allSelected)
            setSelected((p) => {
                const n = new Set(p);
                pageIds.forEach((id) => n.delete(id));
                return n;
            });
        else {
            const avail = MAX_BULK - selected.size;
            const toAdd = pageIds
                .filter((id) => !selected.has(id))
                .slice(0, Math.max(0, avail));
            if (toAdd.length < pageIds.filter((id) => !selected.has(id)).length)
                toast.warning(`Maksimal ${MAX_BULK} aset.`);
            setSelected((p) => {
                const n = new Set(p);
                toAdd.forEach((id) => n.add(id));
                return n;
            });
        }
    };
    const handleDelete = () => {
        if (!deleting) return;
        setDeletingState(true);
        router.delete(destroy.url({ asset: deleting.id }), {
            only: ['assets', 'tree', 'selected', 'breadcrumb'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeletingState(false);
                setDeleting(null);
                toast.success('Aset dihapus.');
            },
            onError: () => {
                setDeletingState(false);
                toast.error('Gagal menghapus.');
            },
        });
    };
    const confirmBulkDelete = () => {
        if (selected.size === 0) return;
        setBulkDeleting(true);
        const ids = Array.from(selected);
        router.delete(destroyBulk.url(), {
            data: { ids },
            only: ['assets', 'tree', 'selected', 'breadcrumb'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setBulkDeleting(false);
                setBulkDeleteOpen(false);
                setSelected(new Set());
                toast.success(`${ids.length} aset dihapus.`);
            },
            onError: () => {
                setBulkDeleting(false);
                toast.error('Gagal hapus massal.');
            },
        });
    };
    const goToPage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, replace: true });
    };
    const handleImport = () => {
        if (!importFile || importing) return;
        setImporting(true);
        const d = new FormData();
        d.append('file', importFile);
        if (importItemId) d.append('item_id', importItemId);
        router.post(importMethod.url(), d, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setImporting(false);
                setImportOpen(false);
                setImportFile(null);
                setImportItemId('');
            },
            onError: () => {
                setImporting(false);
                toast.error('Gagal impor.');
            },
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
            <div className="mx-auto w-full max-w-[1600px]">
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
                                <Boxes
                                    className="size-5 sm:size-6"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                    Aset
                                </h1>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    Folder drill-down + ledger —{' '}
                                    {filters.initialLevel === 'group'
                                        ? 'mulai dari Golongan'
                                        : 'mulai dari Cluster'}
                                    .
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl lg:hidden"
                                onClick={() => setDrawerOpen((v) => !v)}
                            >
                                <Layers className="size-4" /> Klasifikasi
                            </Button>
                            <Link href={scan.url()}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-10 rounded-xl"
                                >
                                    <ScanLine className="size-4 text-primary" />
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-10 rounded-xl"
                                    >
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="min-w-[200px]"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setImportOpen(true)}
                                    >
                                        <UploadCloud className="size-4" />
                                        Import Spreadsheet
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            window.open(
                                                importTemplate.url(),
                                                '_blank',
                                            )
                                        }
                                    >
                                        <Download className="size-4" />
                                        Template Import
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            selected.size > 0 &&
                                            router.visit(
                                                labelsRoute.url({
                                                    query: {
                                                        ids: Array.from(
                                                            selected,
                                                        ),
                                                    },
                                                }),
                                            )
                                        }
                                        disabled={selected.size === 0}
                                    >
                                        <Barcode className="size-4" />
                                        Cetak Barcode
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={labelsBatch.url()}
                                            className="flex items-center gap-2"
                                        >
                                            <Layers className="size-4" />
                                            Cetak Massal
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Link href={withReturnTo(create.url())}>
                                <Button
                                    size="sm"
                                    className="gap-2 rounded-xl px-4 py-2.5"
                                >
                                    <Plus className="size-3.5" />
                                    Tambah Aset
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {breadcrumb.length > 0 && (
                        <nav
                            className="card-enter glass-panel mt-4 flex flex-wrap items-center gap-1.5 px-4 py-3 text-xs delay-100"
                            aria-label="Breadcrumb"
                        >
                            <button
                                type="button"
                                onClick={clearNode}
                                className="rounded px-1.5 py-0.5 hover:bg-muted"
                            >
                                Semua
                            </button>
                            <ChevronRight className="size-3 text-muted-foreground" />
                            {breadcrumb.map((c, i) => (
                                <span
                                    key={c.id}
                                    className="inline-flex items-center gap-1.5"
                                >
                                    {i > 0 && (
                                        <ChevronRight className="size-3 text-muted-foreground" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleNodeSelect({
                                                ...c,
                                                description: null,
                                                child_count: 0,
                                                children: [],
                                            } as BrowseNode)
                                        }
                                        className={cn(
                                            'rounded px-1.5 py-0.5',
                                            LEVEL_TINTS[c.level].bg,
                                            LEVEL_TINTS[c.level].fg,
                                            i === breadcrumb.length - 1 &&
                                                'font-semibold',
                                        )}
                                    >
                                        {c.name}
                                        {c.code && (
                                            <span className="ml-1 font-mono text-[10px] opacity-70">
                                                {c.code}
                                            </span>
                                        )}
                                    </button>
                                </span>
                            ))}
                        </nav>
                    )}

                    <div className="card-enter mt-4 flex flex-col gap-4 delay-100 lg:flex-row lg:items-start">
                        <aside
                            className={cn(
                                'glass-panel flex shrink-0 flex-col overflow-hidden lg:sticky lg:top-4 lg:w-[300px]',
                                drawerOpen ? 'flex' : 'hidden lg:flex',
                            )}
                        >
                            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
                                <h2 className="text-sm font-semibold">
                                    Klasifikasi
                                </h2>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {tree.length} golongan
                                </span>
                            </div>
                            <div className="border-b border-border/60 p-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari klasifikasi..."
                                        value={treeSearch}
                                        onChange={(e) =>
                                            setTreeSearch(e.target.value)
                                        }
                                        className="h-8 pl-8 text-sm"
                                    />
                                </div>
                            </div>
                            <div
                                className="max-h-[50vh] overflow-y-auto p-2 lg:max-h-[60vh]"
                                role="tree"
                                aria-label="Klasifikasi"
                            >
                                {selectedId && (
                                    <button
                                        type="button"
                                        onClick={clearNode}
                                        className="mb-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-muted/60"
                                    >
                                        <FolderOpen className="size-4 text-muted-foreground" />
                                        Semua Aset
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {safeAssets.total}
                                        </span>
                                    </button>
                                )}
                                {visibleFolders.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        Tidak ada klasifikasi.
                                    </p>
                                ) : (
                                    visibleFolders.map((n) => {
                                        const isParent = selectedNode
                                            ? (
                                                  selectedNode.children ?? []
                                              ).some((c) => c.id === n.id)
                                            : false;
                                        return (
                                            <div key={n.id}>
                                                <TreeRow
                                                    node={n}
                                                    selectedId={selectedId}
                                                    onSelect={handleNodeSelect}
                                                />
                                                {isParent &&
                                                    (n.children ?? []).length >
                                                        0 && (
                                                        <div className="ml-2 border-l border-border/40 pl-2">
                                                            {(
                                                                n.children ?? []
                                                            ).map((ch) => (
                                                                <TreeRow
                                                                    key={ch.id}
                                                                    node={ch}
                                                                    selectedId={
                                                                        selectedId
                                                                    }
                                                                    onSelect={
                                                                        handleNodeSelect
                                                                    }
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        <section className="glass-panel flex min-h-[520px] flex-1 flex-col overflow-hidden">
                            <div className="flex flex-col gap-3 border-b border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            if (searchTimer.current)
                                                clearTimeout(
                                                    searchTimer.current,
                                                );
                                            searchTimer.current = setTimeout(
                                                () =>
                                                    reload({
                                                        search: e.target.value,
                                                    }),
                                                350,
                                            );
                                        }}
                                        placeholder="Cari kode, serial, brand, model..."
                                        className="h-10 rounded-xl pr-10 pl-10"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                reload({ search: '' });
                                            }}
                                            className="absolute top-1/2 right-2 size-7 -translate-y-1/2 rounded-lg hover:bg-muted"
                                        >
                                            <X className="mx-auto size-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setFilterOpen(true)}
                                        className="rounded-xl"
                                    >
                                        <SlidersHorizontal className="size-4" />
                                        Filter
                                        {activeFilterCount > 0 && (
                                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
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
                                            className="size-10 rounded-xl"
                                            aria-label="Reset"
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {selectedNode && childFolders.length > 0 && (
                                <div className="border-b border-border/60 bg-muted/20 px-3 py-3">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        {CHILD_LABELS[
                                            selectedNode.level as Exclude<
                                                ClassificationLevel,
                                                'sub-cluster'
                                            >
                                        ] ?? 'Sub'}{' '}
                                        di {selectedNode.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {childFolders.map((f) => (
                                            <FolderChip
                                                key={f.id}
                                                node={f}
                                                onSelect={handleNodeSelect}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!selectedNode &&
                                tree.length > 0 &&
                                safeAssets.total === 0 &&
                                childFolders.length > 0 && (
                                    <div className="border-b border-border/60 bg-muted/20 px-3 py-3">
                                        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Golongan
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {childFolders
                                                .slice(0, 12)
                                                .map((f) => (
                                                    <FolderChip
                                                        key={f.id}
                                                        node={f}
                                                        onSelect={
                                                            handleNodeSelect
                                                        }
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}

                            <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2 text-xs">
                                <label className="flex items-center gap-2 font-medium">
                                    <Checkbox
                                        id="select-all"
                                        checked={allSelected}
                                        onCheckedChange={toggleSelectAll}
                                        disabled={safeAssets.data.length === 0}
                                    />
                                    {selectedNode
                                        ? `Aset di ${breadcrumb[breadcrumb.length - 1]?.name ?? selectedNode.name}`
                                        : 'Semua Aset'}
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary tabular-nums">
                                        {safeAssets.total}
                                    </span>
                                </label>
                                <span className="text-muted-foreground">
                                    {selected.size > 0
                                        ? `${selected.size} dipilih`
                                        : ''}
                                </span>
                            </div>

                            <div className="hidden items-center gap-3 border-b border-border/60 bg-muted/40 px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase lg:flex">
                                <span className="w-6" />
                                <span className="w-[140px]">Kode</span>
                                <span className="flex-1">
                                    Item & Klasifikasi
                                </span>
                                <span className="w-[110px]">Status</span>
                                <span className="w-[90px]">Lokasi</span>
                                <span className="w-[90px]">Dept</span>
                                <span className="w-[96px] text-right">
                                    Aksi
                                </span>
                            </div>

                            <div className="flex-1 overflow-auto">
                                {safeAssets.data.length === 0 ? (
                                    <EmptyState
                                        icon={Inbox}
                                        title={
                                            activeFilterCount > 0 || search
                                                ? 'Tidak ada hasil'
                                                : 'Belum ada aset'
                                        }
                                        description={
                                            activeFilterCount > 0 || search
                                                ? 'Coba ubah filter atau kata kunci.'
                                                : 'Pilih klasifikasi atau tambah aset pertama.'
                                        }
                                        action={
                                            <Link
                                                href={withReturnTo(
                                                    create.url(),
                                                )}
                                            >
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl"
                                                >
                                                    <Plus className="mr-2 size-4" />
                                                    Tambah Aset
                                                </Button>
                                            </Link>
                                        }
                                    />
                                ) : (
                                    <div>
                                        {safeAssets.data.map((a) => (
                                            <LedgerRow
                                                key={a.id}
                                                asset={a}
                                                selected={selected.has(a.id)}
                                                onSelect={() =>
                                                    toggleSelect(a.id)
                                                }
                                                onDelete={() => setDeleting(a)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {safeAssets.last_page > 1 && (
                                <div className="border-t border-border/60 p-3">
                                    <ResourcePagination
                                        links={safeAssets.links}
                                        currentPage={safeAssets.current_page}
                                        lastPage={safeAssets.last_page}
                                        from={safeAssets.from}
                                        to={safeAssets.to}
                                        total={safeAssets.total}
                                        onPageChange={goToPage}
                                    />
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {selected.size > 0 && (
                <div
                    role="toolbar"
                    className={cn(
                        'fixed inset-x-3 z-40 flex items-center justify-between gap-2 rounded-2xl border bg-background/90 p-2 shadow-2xl backdrop-blur-xl',
                        'bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:p-2.5 lg:sticky lg:bottom-6 lg:mx-auto lg:w-fit',
                    )}
                >
                    <span className="flex items-center gap-2 pl-1.5 text-sm font-semibold">
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {selected.size}
                        </span>{' '}
                        dipilih
                        <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
                            {' '}
                            · maks {MAX_BULK}
                        </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl sm:size-9"
                            onClick={() => setSelected(new Set())}
                            aria-label="Batalkan"
                        >
                            <X className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-xl text-destructive hover:bg-destructive/10 sm:size-9"
                            onClick={() => setBulkDeleteOpen(true)}
                            aria-label="Hapus"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-10 rounded-xl px-3 sm:h-9"
                            onClick={() =>
                                selected.size > 0 &&
                                router.visit(
                                    labelsRoute.url({
                                        query: { ids: Array.from(selected) },
                                    }),
                                )
                            }
                        >
                            <Barcode className="size-4" />
                            Barcode
                        </Button>
                    </div>
                </div>
            )}

            <Dialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Aset</DialogTitle>
                        <DialogDescription>
                            Yakin hapus{' '}
                            <span className="font-semibold text-foreground">
                                {deleting?.kode_asset ?? ''}
                            </span>
                            ? Tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletingState}
                        >
                            {deletingState && (
                                <Spinner className="mr-2 size-4" />
                            )}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={bulkDeleteOpen}
                onOpenChange={(o) => !bulkDeleting && setBulkDeleteOpen(o)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Terpilih</DialogTitle>
                        <DialogDescription>
                            Hapus{' '}
                            <span className="font-semibold text-foreground">
                                {selected.size}
                            </span>{' '}
                            aset?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBulkDeleteOpen(false)}
                            disabled={bulkDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmBulkDelete}
                            disabled={bulkDeleting}
                        >
                            {bulkDeleting && (
                                <Spinner className="mr-2 size-4" />
                            )}
                            Hapus {selected.size} Aset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import Aset</DialogTitle>
                        <DialogDescription>
                            Unggah spreadsheet aset.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3">
                        <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) =>
                                setImportFile(e.target.files?.[0] ?? null)
                            }
                        />
                        <Input
                            placeholder="Item ID (opsional)"
                            value={importItemId}
                            onChange={(e) => setImportItemId(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImportOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleImport}
                            disabled={!importFile || importing}
                        >
                            {importing && <Spinner className="mr-2 size-4" />}
                            Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent className="glass-panel border-border/30 bg-background/85 shadow-2xl backdrop-blur-xl sm:max-w-lg">
                    <DialogHeader className="border-b border-border/20 pb-3">
                        <DialogTitle className="flex items-center gap-2">
                            <Filter className="size-5 text-primary" />
                            Filter Aset
                        </DialogTitle>
                        <DialogDescription>Persempit daftar.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Kondisi</Label>
                            <Select
                                value={conditionFilter}
                                onValueChange={setConditionFilter}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Semua Kondisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONDITION_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select
                                value={departmentFilter}
                                onValueChange={setDepartmentFilter}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Semua Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        Semua Department
                                    </SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem
                                            key={d.id_department}
                                            value={d.id_department}
                                        >
                                            {d.nama_department}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Pencarian</Label>
                            <Input
                                placeholder="Cari kode, serial, brand, model..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-3 border-t border-border/20 pt-4 sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={clearFilters}
                        >
                            <Trash2 className="size-4" />
                            Reset
                        </Button>
                        <Button
                            type="button"
                            onClick={applyFilters}
                            className="rounded-xl bg-primary px-5"
                        >
                            <Filter className="size-4" />
                            Terapkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Manage.layout = { breadcrumbs: [{ title: 'Aset', href: index.url() }] };
