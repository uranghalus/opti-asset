import { Link, router, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    FileText,
    Inbox,
    Layers,
    MapPin,
    Package,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Spinner } from '@/components/ui/spinner';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import {
    create as createRoute,
    destroy,
    edit as editRoute,
    index as indexRoute,
} from '@/routes/assets';

type Classification = {
    id: string;
    code: string | null;
    name: string;
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
    item: { id: string; name: string; code: string } | null;
    location: { id: string; name: string } | null;
    department: { id_department: string; nama_department: string } | null;
    assetGroup: Classification | null;
    assetCategory: Classification | null;
    assetCluster: Classification | null;
    assetSubCluster: Classification | null;
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
    filters: {
        search: string;
        group: string;
        category: string;
        status: string;
    };
};

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
    { value: 'DISPOSED', label: 'Dihapus' },
];

const CONDITION_ACCENTS: Record<string, string> = {
    Baik: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    'Rusak Ringan':
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'Rusak Berat':
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

const CHAIN_ACCENTS = [
    'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300',
];

const CHAIN_ICONS = [Layers, Boxes, Tags, ShieldCheck];

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
    const { assets, groups, filters } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [groupFilter, setGroupFilter] = useState(filters.group);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

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

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            { preserveState: true, replace: true, only: ['assets', 'filters'] },
        );
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

    const hasFilters = Boolean(
        filters.search || filters.group || filters.status,
    );

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

                        <Select
                            value={groupFilter}
                            onValueChange={(value) => {
                                setGroupFilter(value);
                                reload({ group: value });
                            }}
                        >
                            <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl lg:w-56">
                                <SelectValue placeholder="Semua Golongan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Semua Golongan</SelectItem>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.code ? `${group.code} — ` : ''}
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                                reload({ status: value });
                            }}
                        >
                            <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl lg:w-48">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Semua Aset
                        </h2>
                        <div className="flex items-center gap-3">
                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setGroupFilter('');
                                        setStatusFilter('');
                                        reload({
                                            search: '',
                                            group: '',
                                            status: '',
                                        });
                                    }}
                                    className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 size-3.5" />
                                    Hapus filter
                                </Button>
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
                                    {hasFilters
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada aset'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {hasFilters
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
                                    asset.assetGroup,
                                    asset.assetCategory,
                                    asset.assetCluster,
                                    asset.assetSubCluster,
                                ].filter(Boolean) as Classification[];

                                return (
                                    <div
                                        key={asset.id}
                                        className="glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                                    <Package
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {asset.item?.name ??
                                                            'Aset'}
                                                    </h3>
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {[
                                                            asset.brand,
                                                            asset.model,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ') || '—'}
                                                    </p>
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
                                                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                                    asset.status === 'ACTIVE'
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        asset.status ===
                                                            'ACTIVE'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-slate-400',
                                                    )}
                                                />
                                                {asset.status}
                                            </span>
                                        </div>

                                        <div className="relative mt-3.5 flex flex-1 flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-1">
                                                {chain.map(
                                                    (level, chainIndex) => {
                                                        const Icon =
                                                            CHAIN_ICONS[
                                                                chainIndex %
                                                                    CHAIN_ICONS.length
                                                            ];

                                                        return (
                                                            <span
                                                                key={chainIndex}
                                                                className={cn(
                                                                    'inline-flex max-w-40 items-center gap-1 truncate rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1',
                                                                    CHAIN_ACCENTS[
                                                                        chainIndex %
                                                                            CHAIN_ACCENTS.length
                                                                    ],
                                                                )}
                                                            >
                                                                <Icon
                                                                    className="size-3 shrink-0"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                />
                                                                <span className="truncate">
                                                                    {level.name}
                                                                </span>
                                                            </span>
                                                        );
                                                    },
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
