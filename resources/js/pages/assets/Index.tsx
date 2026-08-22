import { Link, router, usePage } from '@inertiajs/react';
import {
    Barcode,
    Boxes,
    Building2,
    CheckCircle2,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
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
import { useIsProcessing } from '@/hooks/use-is-processing';
import {
    ASSET_STATUSES,
    assetStatusChip,
    assetStatusDot,
    assetStatusLabel,
} from '@/lib/asset-status';
import { cn } from '@/lib/utils';
import {
    create as createRoute,
    destroy,
    edit as editRoute,
    importMethod,
    importTemplate,
    index as indexRoute,
    labels as labelsRoute,
    labelsBatch as labelsBatchRoute,
    scan as scanRoute,
    show as showRoute,
} from '@/routes/assets';

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
    assets: PaginatedData<Asset>;
    groups: Classification[];
    items: {
        id: string;
        code: string;
        name: string;
        category_code: string | null;
    }[];
    departments: { id_department: string; nama_department: string }[];
    filters: {
        search: string;
        group: string;
        category: string;
        status: string;
        department: string;
        condition: string;
    };
};

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    ...ASSET_STATUSES.map((status) => ({
        value: status.value,
        label: status.label,
    })),
];

const CONDITION_OPTIONS = [
    { value: '', label: 'Semua Kondisi' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
];

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

export default function AssetsIndex() {
    const { assets, groups, items, departments, filters } = usePage()
        .props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [groupFilter, setGroupFilter] = useState(filters.group);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [departmentFilter, setDepartmentFilter] = useState(
        filters.department,
    );
    const [conditionFilter, setConditionFilter] = useState(filters.condition);
    const [filterOpen, setFilterOpen] = useState(false);
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    const pageIds = assets.data.map((asset) => asset.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.has(id));

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected(allSelected ? new Set() : new Set(pageIds));
    };

    const openLabels = () => {
        if (selected.size === 0) {
            return;
        }

        router.visit(labelsRoute().url, {
            data: { ids: Array.from(selected) },
        });
    };

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

    const reload = (overrides: Record<string, string>) => {
        const params: Record<string, string> = {};

        if (search.trim()) {
            params.search = search.trim();
        }

        if (groupFilter) {
            params.group = groupFilter;
        }

        if (statusFilter) {
            params.status = statusFilter;
        }

        if (departmentFilter) {
            params.department = departmentFilter;
        }

        if (conditionFilter) {
            params.condition = conditionFilter;
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            { preserveState: true, replace: true, only: ['assets', 'filters'] },
        );
    };

    const applyFilters = () => {
        setFilterOpen(false);
        reload({});
    };

    const clearFilters = () => {
        setSearch('');
        setGroupFilter('');
        setStatusFilter('');
        setDepartmentFilter('');
        setConditionFilter('');
        setFilterOpen(false);
        reload({
            search: '',
            group: '',
            status: '',
            department: '',
            condition: '',
        });
    };

    const handleDelete = () => {
        if (!deleting) {
            return;
        }

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

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const activeFilterCount = [
        groupFilter,
        statusFilter,
        departmentFilter,
        conditionFilter,
    ].filter(Boolean).length;

    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [importItemId, setImportItemId] = useState('');

    const handleImportSubmit = () => {
        if (!importFile || !importItemId || importing) {
            return;
        }

        setImporting(true);
        setImportError(null);

        const data = new FormData();
        data.append('file', importFile);
        data.append('item_id', importItemId);

        router.post(importMethod().url, data, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setImporting(false);
                setImportOpen(false);
                setImportFile(null);
                setImportItemId('');
            },
            onError: (errors) => {
                setImporting(false);
                setImportError(
                    typeof errors.file === 'string'
                        ? errors.file
                        : 'Tidak dapat mengimpor file. Periksa kembali format file Anda.',
                );
            },
        });
    };

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]"
            />
            <div className="mx-auto w-full max-w-6xl">
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

                    <div className="card-enter flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Boxes className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Daftar Aset
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelola aset organisasi Anda. Kode aset
                                    dibuat otomatis dari klasifikasi.
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Link href={scanRoute().url}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-xl border-primary/25 bg-primary/5 shadow-sm backdrop-blur-xl"
                                >
                                    <ScanLine className="size-4 text-primary" />
                                </Button>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
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
                                        className="flex items-center gap-2"
                                    >
                                        <UploadCloud className="size-4" />
                                        Import Spreadsheet
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={openLabels}
                                        disabled={selected.size === 0}
                                        className="flex items-center gap-2"
                                    >
                                        <Barcode className="size-4" />
                                        Cetak Barcode
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={labelsBatchRoute().url}
                                            className="flex items-center gap-2"
                                        >
                                            <Layers className="size-4" />
                                            Cetak Massal
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Link href={createRoute().url}>
                                <Button
                                    size="sm"
                                    className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                                >
                                    <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                        <Plus
                                            className="size-3.5"
                                            strokeWidth={2.25}
                                        />
                                    </span>
                                    Tambah Aset
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="glass-panel card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100 lg:flex-row lg:items-center lg:gap-4">
                        <div className="group relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);

                                    if (searchTimer.current) {
                                        clearTimeout(searchTimer.current);
                                    }

                                    searchTimer.current = setTimeout(
                                        () =>
                                            reload({
                                                search: event.target.value,
                                            }),
                                        350,
                                    );
                                }}
                                placeholder="Cari kode aset, serial, brand, atau model..."
                                className="h-11! rounded-xl border-border/70 bg-card/70 pr-10 pl-10 text-sm shadow-sm backdrop-blur-xl"
                            />
                            {search ? (
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all hover:scale-110 hover:bg-card hover:text-foreground"
                                    onClick={() => {
                                        setSearch('');
                                        reload({ search: '' });
                                    }}
                                    aria-label="Bersihkan pencarian"
                                >
                                    <X className="size-4" />
                                </button>
                            ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFilterOpen(true)}
                                className="h-11! shrink-0 rounded-xl border-border/70 bg-card/70 px-4 text-sm font-medium shadow-sm backdrop-blur-xl"
                            >
                                <SlidersHorizontal className="size-4" />
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
                                    className="h-11! w-11 shrink-0 rounded-xl"
                                    aria-label="Hapus semua filter"
                                    title="Hapus semua filter"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="select-all-assets"
                                aria-label="Pilih semua aset"
                                checked={allSelected}
                                onCheckedChange={toggleSelectAll}
                                disabled={assets.data.length === 0}
                            />
                            <h2 className="text-sm font-semibold tracking-wide text-foreground">
                                Semua Aset
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <Filter
                                        className="size-3.5"
                                        strokeWidth={1.75}
                                    />
                                    {activeFilterCount} filter aktif
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                <Boxes
                                    className="size-3.5"
                                    strokeWidth={1.75}
                                />
                                {assets.total}
                            </span>
                        </div>
                    </div>

                    {assets.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {activeFilterCount > 0 || search
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada aset'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {activeFilterCount > 0 || search
                                        ? 'Tidak ditemukan aset dengan filter tersebut. Coba kata kunci lain.'
                                        : 'Tambahkan aset pertama Anda untuk mulai mencatat inventaris.'}
                                </p>
                            </div>
                            <Link href={createRoute().url}>
                                <Button size="sm" className="rounded-xl">
                                    <Plus className="mr-2 size-4" />
                                    Tambah Aset
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {assets.data.map((asset) => {
                                const chain = [
                                    asset.asset_group,
                                    asset.asset_category,
                                    asset.asset_cluster,
                                    asset.asset_sub_cluster,
                                ].filter(Boolean) as Classification[];

                                return (
                                    <div
                                        key={asset.id}
                                        className="glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Checkbox
                                                    aria-label={`Pilih ${asset.kode_asset ?? asset.id}`}
                                                    checked={selected.has(
                                                        asset.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelect(asset.id)
                                                    }
                                                    className="mt-1 shrink-0"
                                                />
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="relative size-11 shrink-0">
                                                        {asset
                                                            .photo_url?.[0] ? (
                                                            <>
                                                                <img
                                                                    src={
                                                                        asset
                                                                            .photo_url[0]
                                                                    }
                                                                    alt="Foto aset"
                                                                    className="size-11 rounded-xl border border-border/70 object-cover shadow-md ring-1 ring-primary/10"
                                                                />
                                                                {asset.photo_url
                                                                    .length >
                                                                    1 && (
                                                                    <span className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-background px-1 text-[9px] font-bold text-muted-foreground tabular-nums shadow-sm">
                                                                        +
                                                                        {asset
                                                                            .photo_url
                                                                            .length -
                                                                            1}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                                                <Package
                                                                    className="size-5"
                                                                    strokeWidth={
                                                                        1.75
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={
                                                                showRoute(
                                                                    asset.id,
                                                                ).url
                                                            }
                                                            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                                                        >
                                                            {asset.item?.name ??
                                                                'Aset'}
                                                        </Link>
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {[
                                                                asset.brand,
                                                                asset.model,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ') ||
                                                                '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Link
                                                    href={
                                                        editRoute(asset.id).url
                                                    }
                                                >
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
                                                    onClick={() =>
                                                        setDeleting(asset)
                                                    }
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
                                                    assetStatusChip(
                                                        asset.status,
                                                    ),
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        assetStatusDot(
                                                            asset.status,
                                                        ),
                                                    )}
                                                />
                                                {assetStatusLabel(asset.status)}
                                            </span>
                                        </div>

                                        <div className="relative mt-3.5 flex flex-1 flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-1">
                                                {chain.length > 0 ? (
                                                    chain.map(
                                                        (level, index) => (
                                                            <span
                                                                key={`${level.id}-${index}`}
                                                                className="inline-flex items-center"
                                                            >
                                                                {index > 0 && (
                                                                    <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
                                                                )}
                                                                <span className="inline-flex max-w-40 items-center gap-1 truncate rounded-md px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/70">
                                                                    <span className="truncate">
                                                                        {
                                                                            level.name
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        ),
                                                    )
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
                                                        <span className="truncate">
                                                            {asset.item.name}
                                                        </span>
                                                    </p>
                                                )}
                                                {asset.serial_number && (
                                                    <p className="flex items-center gap-1.5 truncate font-mono text-muted-foreground">
                                                        <FileText
                                                            className="size-3.5 shrink-0"
                                                            strokeWidth={2}
                                                        />
                                                        <span className="truncate">
                                                            {
                                                                asset.serial_number
                                                            }
                                                        </span>
                                                    </p>
                                                )}
                                                {asset.document_url?.length >
                                                    0 && (
                                                    <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                                                        <FileText
                                                            className="size-3.5 shrink-0"
                                                            strokeWidth={2}
                                                        />
                                                        <span>
                                                            {
                                                                asset
                                                                    .document_url
                                                                    .length
                                                            }{' '}
                                                            dokumen
                                                        </span>
                                                    </p>
                                                )}
                                                {asset.location && (
                                                    <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                                                        <MapPin
                                                            className="size-3.5 shrink-0"
                                                            strokeWidth={2}
                                                        />
                                                        <span className="truncate">
                                                            {
                                                                asset.location
                                                                    .name
                                                            }
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
                                                            {
                                                                asset.department
                                                                    .nama_department
                                                            }
                                                        </span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1',
                                                        conditionAccent(
                                                            asset.condition,
                                                        ),
                                                    )}
                                                >
                                                    {asset.condition ?? '—'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                                    {formatDate(
                                                        asset.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selected.size > 0 && (
                        <div className="card-enter sticky bottom-4 z-20 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-background/85 px-4 py-3 shadow-xl backdrop-blur-xl delay-150">
                            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                                    {selected.size}
                                </span>
                                <span className="truncate">aset dipilih</span>
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    onClick={() => setSelected(new Set())}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-9 gap-2 rounded-xl"
                                    onClick={openLabels}
                                >
                                    <Barcode className="size-4" />
                                    Cetak Barcode
                                </Button>
                            </div>
                        </div>
                    )}

                    {assets.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Menampilkan {assets.from}–{assets.to} dari{' '}
                                {assets.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!assets.links[0]?.url}
                                    onClick={() =>
                                        goToPage(assets.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {assets.links.slice(1, -1).map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="icon"
                                        className="h-9 w-9 rounded-xl"
                                        disabled={!link.url}
                                        onClick={() => goToPage(link.url)}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={
                                        !assets.links[assets.links.length - 1]
                                            ?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            assets.links[
                                                assets.links.length - 1
                                            ]?.url,
                                        )
                                    }
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import Aset</DialogTitle>
                        <DialogDescription>
                            Unggah file spreadsheet untuk menambahkan banyak
                            aset sekaligus.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                                <Layers className="size-3.5" />
                                Item Aset
                            </Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Pilih item (wajib). Semua baris di file akan
                                diimpor sebagai aset dari item ini, dengan kode
                                otomatis dari kategori item.
                            </p>
                            <div className="mt-3">
                                <Label htmlFor="import-item">Item</Label>
                                <Select
                                    value={importItemId}
                                    onValueChange={setImportItemId}
                                >
                                    <SelectTrigger
                                        id="import-item"
                                        className="mt-1.5 h-10 bg-background/70"
                                    >
                                        <SelectValue placeholder="Pilih Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code} — {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            asChild
                            className="h-auto justify-start gap-3 rounded-xl border-dashed py-3.5 text-left"
                        >
                            <a href={importTemplate().url}>
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Download className="size-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold">
                                        Unduh Template Excel
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Gunakan template .xlsx resmi untuk
                                        format yang benar
                                    </span>
                                </span>
                            </a>
                        </Button>

                        <div
                            className={cn(
                                'group relative rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                                !importItemId &&
                                    'pointer-events-none opacity-60',
                                dragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/40 hover:bg-accent/40',
                            )}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);

                                const file = e.dataTransfer.files?.[0];

                                if (file) {
                                    setImportFile(file);
                                    setImportError(null);
                                }
                            }}
                        >
                            <input
                                id="import-file"
                                type="file"
                                accept=".xlsx,.csv,.ods"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setImportFile(file);
                                    setImportError(null);
                                }}
                            />
                            <label
                                htmlFor="import-file"
                                className="flex cursor-pointer flex-col items-center gap-2"
                            >
                                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                    <FileSpreadsheet
                                        className="size-6"
                                        strokeWidth={1.5}
                                    />
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {importFile
                                        ? importFile.name
                                        : 'Klik atau seret file ke sini'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {importItemId
                                        ? 'Format didukung: .xlsx, .csv, .ods (maks. 5 MB)'
                                        : 'Pilih item terlebih dahulu'}
                                </span>
                            </label>
                            {importFile && (
                                <button
                                    type="button"
                                    className="mt-3 inline-flex items-center gap-1 rounded-lg text-xs font-medium text-destructive hover:underline"
                                    onClick={() => {
                                        setImportFile(null);
                                        setImportError(null);
                                    }}
                                >
                                    <X className="size-3.5" />
                                    Hapus file
                                </button>
                            )}
                        </div>

                        {importError && (
                            <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                                <X className="size-3.5" />
                                {importError}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setImportOpen(false);
                                setImportFile(null);
                                setImportItemId('');
                                setImportError(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleImportSubmit}
                            disabled={!importFile || !importItemId || importing}
                            className="gap-2"
                        >
                            {importing ? (
                                <Spinner className="size-4" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            {importing ? 'Mengimpor...' : 'Mulai Import'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent className="glass-panel ease-out-[cubic-bezier(0.16,1,0.3,1)] animate-in border-border/30 bg-background/85 shadow-2xl backdrop-blur-xl duration-200 zoom-in-95 fade-in sm:max-w-lg">
                    <DialogHeader className="border-b border-border/20 pb-3">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                            <Filter
                                className="size-5 text-primary"
                                strokeWidth={2}
                            />
                            Filter Aset
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                            Persempit daftar aset berdasarkan kriteria berikut.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Golongan
                            </Label>
                            <Select
                                value={groupFilter}
                                onValueChange={setGroupFilter}
                            >
                                <SelectTrigger className="h-10 border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Semua Golongan" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel overflow-hidden rounded-xl border-border/30 bg-background/90 p-1 shadow-2xl backdrop-blur-xl">
                                    <SelectItem
                                        value=""
                                        className="px-3 py-2 text-sm"
                                    >
                                        Semua Golongan
                                    </SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem
                                            key={group.id}
                                            value={group.id}
                                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 focus:bg-primary/5"
                                        >
                                            {group.code
                                                ? `${group.code} — `
                                                : ''}
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Department
                            </Label>
                            <Select
                                value={departmentFilter}
                                onValueChange={setDepartmentFilter}
                            >
                                <SelectTrigger className="h-10 border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Semua Department" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel overflow-hidden rounded-xl border-border/30 bg-background/90 p-1 shadow-2xl backdrop-blur-xl">
                                    <SelectItem
                                        value=""
                                        className="px-3 py-2 text-sm"
                                    >
                                        Semua Department
                                    </SelectItem>
                                    {departments.map((department) => (
                                        <SelectItem
                                            key={department.id_department}
                                            value={department.id_department}
                                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 focus:bg-primary/5"
                                        >
                                            {department.nama_department}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Status Aset
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="h-10 border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel overflow-hidden rounded-xl border-border/30 bg-background/90 p-1 shadow-2xl backdrop-blur-xl">
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 focus:bg-primary/5"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Kondisi Aset
                            </Label>
                            <Select
                                value={conditionFilter}
                                onValueChange={setConditionFilter}
                            >
                                <SelectTrigger className="h-10 border-border/40 bg-background/70 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Semua Kondisi" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel overflow-hidden rounded-xl border-border/30 bg-background/90 p-1 shadow-2xl backdrop-blur-xl">
                                    {CONDITION_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 focus:bg-primary/5"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 gap-3 border-t border-border/20 pt-4 sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={clearFilters}
                            className="h-10 gap-2 px-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                        >
                            <X className="size-4" strokeWidth={2} />
                            Reset
                        </Button>
                        <Button
                            type="button"
                            onClick={applyFilters}
                            className="h-10 gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
                        >
                            <Filter className="size-4" strokeWidth={2} />
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Aset</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus aset{' '}
                            <span className="font-semibold text-foreground">
                                {deleting?.kode_asset ?? ''}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
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
        </div>
    );
}

AssetsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Aset',
            href: indexRoute().url,
        },
    ],
};
