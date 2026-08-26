import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Filter,
    History,
    Inbox,
    MapPin,
    Package,
    Plus,
    Search,
    User,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import {
    create as createRoute,
    index as indexRoute,
} from '@/routes/asset-transfers';

type Asset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
};

type Location = {
    id: string;
    name: string;
};

type Department = {
    id_department: string;
    nama_department: string;
};

type Transfer = {
    id: string;
    asset_id: string;
    from_location_id: string | null;
    to_location_id: string | null;
    from_department_id: string | null;
    to_department_id: string | null;
    from_user_id: string | null;
    to_user_id: string | null;
    quantity: number;
    status: string;
    notes: string | null;
    requested_by: string | null;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    asset: Asset | null;
    fromLocation: Location | null;
    toLocation: Location | null;
    requester: { id: string; name: string } | null;
    approver: { id: string; name: string } | null;
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

type Filters = {
    search: string;
    status: string;
};

type PageProps = {
    transfers: PaginatedData<Transfer>;
    departments: Department[];
    filters: Filters;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu Persetujuan' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function AssetTransfersIndex() {
    const { transfers, departments, filters } = usePage()
        .props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [prevFilters, setPrevFilters] = useState(filters);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
        null,
    );
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

    const statusLabels: Record<string, string> = {
        pending: 'Menunggu Persetujuan',
        approved: 'Disetujui',
        rejected: 'Ditolak',
    };

    const statusColors: Record<string, string> = {
        pending:
            'bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300',
        approved:
            'bg-emerald-500/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300',
        rejected:
            'bg-rose-500/10 text-rose-700 ring-rose-500/10 dark:text-rose-300',
    };

    if (
        filters.search !== prevFilters.search ||
        filters.status !== prevFilters.status
    ) {
        setPrevFilters(filters);
        setSearch(filters.search ?? '');
        setStatusFilter(filters.status ?? '');
    }

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

    const reload = (overrides: Record<string, string> = {}) => {
        const currentSearch =
            overrides.search !== undefined ? overrides.search : search;
        const currentStatus =
            overrides.status !== undefined ? overrides.status : statusFilter;

        const params: Record<string, string> = {};

        if (currentSearch.trim()) {
            params.search = currentSearch.trim();
        }

        if (currentStatus) {
            params.status = currentStatus;
        }

        router.get(indexRoute().url, params, {
            preserveState: true,
            replace: true,
            only: [
                'transfers',
                'assets',
                'locations',
                'departments',
                'employees',
                'filters',
            ],
        });
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            reload(value.trim() ? { search: value.trim() } : { search: '' });
        }, 350);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        reload({ status: value });
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        reload({ search: '', status: '' });
        searchInputRef.current?.focus();
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const openDetail = (transfer: Transfer) => {
        setSelectedTransfer(transfer);
        setDetailOpen(true);
    };

    return (
        <>
            <Head title="Mutasi Aset" />

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <VibrantBackground variant="amber" />
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
                                <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-emerald-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                    <History
                                        className="size-6"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        Mutasi Aset
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Kelola permohonan mutasi, pemindahan,
                                        dan peminjaman aset antar lokasi atau
                                        pengguna.
                                    </p>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                asChild
                                className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                            >
                                <Link href={createRoute().url}>
                                    <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                        <Plus
                                            className="size-3.5"
                                            strokeWidth={2.25}
                                        />
                                    </span>
                                    Ajukan Mutasi
                                </Link>
                            </Button>
                        </div>

                        <div className="glass-panel card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100 lg:flex-row lg:items-center lg:gap-4">
                            <div className="group relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    ref={searchInputRef}
                                    value={search}
                                    onChange={(event) =>
                                        handleSearchChange(event.target.value)
                                    }
                                    placeholder="Cari kode aset, serial number, atau nomor..."
                                    className="h-11! rounded-xl border-border/70 bg-card/70 pr-16 pl-10 text-sm text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md focus:ring-primary/25"
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-card hover:text-foreground active:scale-95"
                                        onClick={clearFilters}
                                        aria-label="Clear search"
                                    >
                                        <X className="size-4" />
                                    </button>
                                ) : (
                                    <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground transition-colors group-focus-within:border-primary/30 group-focus-within:text-primary/70 sm:inline-flex">
                                        /
                                    </kbd>
                                )}
                            </div>

                            <div
                                aria-hidden
                                className="hidden h-8 w-px shrink-0 bg-border/60 lg:block"
                            />

                            <Select
                                value={statusFilter}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-44">
                                    <Filter className="size-4 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Filter status" />
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
                            <div className="flex items-center gap-2.5">
                                <History className="size-5 text-muted-foreground" />
                                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                                    Daftar Mutasi
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                <History
                                    className="size-3.5"
                                    strokeWidth={1.75}
                                />
                                {transfers.total}
                            </span>
                        </div>

                        {transfers.data.length === 0 ? (
                            <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                                <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                    <Inbox
                                        className="size-7"
                                        strokeWidth={1.25}
                                    />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-foreground">
                                        {search.trim()
                                            ? 'Tidak ada hasil pencarian'
                                            : statusFilter
                                              ? 'Tidak ada mutasi dengan status ini'
                                              : 'Belum ada permohonan mutasi'}
                                    </p>
                                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                        {search.trim()
                                            ? `Tidak ditemukan mutasi untuk "${search}". Coba kata kunci lain.`
                                            : statusFilter
                                              ? 'Semua permohonan mutasi dengan filter ini sudah ditampilkan.'
                                              : 'Ajukan mutasi aset pertama untuk mulai melacak perpindahan aset.'}
                                    </p>
                                </div>
                                {!search.trim() && !statusFilter ? (
                                    <Button
                                        size="sm"
                                        asChild
                                        className="rounded-xl"
                                    >
                                        <Link href={createRoute().url}>
                                            <Plus className="mr-2 size-4" />
                                            Ajukan Mutasi
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="rounded-xl"
                                    >
                                        <X className="mr-2 size-4" />
                                        Hapus filter
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {transfers.data.map((transfer) => (
                                    <div
                                        key={transfer.id}
                                        className="glass-card group ease-premium relative flex h-full flex-col overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <Package
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">
                                                        {transfer.asset
                                                            ?.kode_asset ??
                                                            transfer.asset
                                                                ?.serial_number ??
                                                            '—'}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {transfer.asset?.brand
                                                            ? `${transfer.asset.brand} ${transfer.asset.model ?? ''}`
                                                            : 'Tanpa nama aset'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                                                    statusColors[
                                                        transfer.status
                                                    ] ??
                                                        'bg-muted/50 text-muted-foreground',
                                                )}
                                            >
                                                {statusLabels[
                                                    transfer.status
                                                ] ?? transfer.status}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {transfer.fromLocation
                                                        ?.name ?? '—'}
                                                    {' → '}
                                                    {transfer.toLocation
                                                        ?.name ?? '—'}
                                                </span>
                                            </div>

                                            {transfer.to_department_id && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <User className="size-3.5 shrink-0" />
                                                    <span className="truncate">
                                                        Departemen:
                                                        {departments.find(
                                                            (d) =>
                                                                d.id_department ===
                                                                transfer.to_department_id,
                                                        )?.nama_department ??
                                                            '—'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <History className="size-3.5 shrink-0" />
                                                <span>
                                                    Diajukan{' '}
                                                    {formatDate(
                                                        transfer.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 flex-1"
                                                onClick={() =>
                                                    openDetail(transfer)
                                                }
                                            >
                                                Detail
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {transfers.last_page > 1 && (
                            <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan {transfers.from}–{transfers.to}{' '}
                                    dari {transfers.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl"
                                        disabled={!transfers.links[0]?.url}
                                        onClick={() =>
                                            goToPage(transfers.links[0]?.url)
                                        }
                                    >
                                        Sebelumnya
                                    </Button>
                                    {transfers.links
                                        .slice(1, -1)
                                        .map((link, i) => (
                                            <Button
                                                key={i}
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="icon"
                                                className="h-9 w-9 rounded-xl"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    goToPage(link.url)
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl"
                                        disabled={
                                            !transfers.links[
                                                transfers.links.length - 1
                                            ]?.url
                                        }
                                        onClick={() =>
                                            goToPage(
                                                transfers.links[
                                                    transfers.links.length - 1
                                                ]?.url,
                                            )
                                        }
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Detail Mutasi Aset
                                    </DialogTitle>
                                    <DialogDescription>
                                        {selectedTransfer
                                            ? `Mutasi aset ${selectedTransfer.asset?.kode_asset ?? '-'} — ${statusLabels[selectedTransfer.status] ?? selectedTransfer.status}`
                                            : ''}
                                    </DialogDescription>
                                </DialogHeader>

                                {selectedTransfer && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Kode Aset
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-foreground">
                                                    {selectedTransfer.asset
                                                        ?.kode_asset ?? '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Serial Number
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-foreground">
                                                    {selectedTransfer.asset
                                                        ?.serial_number ?? '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Lokasi Asal
                                                </p>
                                                <p className="mt-1 text-sm text-foreground">
                                                    {selectedTransfer
                                                        .fromLocation?.name ??
                                                        '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Lokasi Tujuan
                                                </p>
                                                <p className="mt-1 text-sm text-foreground">
                                                    {selectedTransfer.toLocation
                                                        ?.name ?? '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Diajukan Oleh
                                                </p>
                                                <p className="mt-1 text-sm text-foreground">
                                                    {selectedTransfer.requester
                                                        ?.name ?? '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Tanggal Pengajuan
                                                </p>
                                                <p className="mt-1 text-sm text-foreground">
                                                    {formatDate(
                                                        selectedTransfer.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            {selectedTransfer.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Catatan
                                                    </p>
                                                    <p className="mt-1 text-sm text-foreground">
                                                        {selectedTransfer.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDetailOpen(false)}
                                    >
                                        Tutup
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </>
    );
}

AssetTransfersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Mutasi Aset',
            href: indexRoute().url,
        },
    ],
};
