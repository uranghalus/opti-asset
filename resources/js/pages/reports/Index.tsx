import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArchiveX,
    Box,
    Filter,
    History,
    MapPin,
    Package,
    Search,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { index as reportsIndexRoute } from '@/routes/reports';

type Transfer = {
    id: string;
    asset_id: string;
    from_location_id: string | null;
    to_location_id: string | null;
    quantity: number;
    status: string;
    notes: string | null;
    created_at: string;
    asset: {
        id: string;
        kode_asset: string | null;
        serial_number: string | null;
        brand: string | null;
        model: string | null;
    } | null;
    fromLocation: { id: string; name: string } | null;
    toLocation: { id: string; name: string } | null;
    requester: { id: string; name: string } | null;
};

type Disposal = {
    id: number;
    asset_id: string;
    reason: string | null;
    disposal_date: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    asset: {
        id: string;
        kode_asset: string | null;
        serial_number: string | null;
        item_id: string | null;
        item: { id: string; name: string } | null;
    } | null;
    disposedBy: { id: number; name: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = {
    transfer_search: string;
    transfer_status: string;
    disposal_search: string;
    disposal_status: string;
};

type PageProps = {
    transfers: PaginatedData<Transfer>;
    disposals: PaginatedData<Disposal>;
    filters: Filters;
};

const TRANSFER_STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu Persetujuan' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

const DISPOSAL_STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

const TRANSFER_STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 ring-amber-500/10 dark:text-amber-300',
    approved: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300',
    rejected: 'bg-rose-500/10 text-rose-700 ring-rose-500/10 dark:text-rose-300',
};

const DISPOSAL_STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

const DISPOSAL_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    approved: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    rejected: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ReportsIndex() {
    const { transfers, disposals, filters } = usePage().props as unknown as PageProps;

    const [tSearch, setTSearch] = useState(filters.transfer_search ?? '');
    const [tStatus, setTStatus] = useState(filters.transfer_status ?? '');
    const [dSearch, setDSearch] = useState(filters.disposal_search ?? '');
    const [dStatus, setDStatus] = useState(filters.disposal_status ?? '');
    const [prevFilters, setPrevFilters] = useState(filters);
    const tTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    if (
        filters.transfer_search !== prevFilters.transfer_search ||
        filters.transfer_status !== prevFilters.transfer_status ||
        filters.disposal_search !== prevFilters.disposal_search ||
        filters.disposal_status !== prevFilters.disposal_status
    ) {
        setPrevFilters(filters);
        setTSearch(filters.transfer_search ?? '');
        setTStatus(filters.transfer_status ?? '');
        setDSearch(filters.disposal_search ?? '');
        setDStatus(filters.disposal_status ?? '');
    }

    useEffect(() => () => {
        if (tTimer.current) clearTimeout(tTimer.current);
        if (dTimer.current) clearTimeout(dTimer.current);
    }, []);

    const reload = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {};

        if (overrides.tSearch !== undefined ? overrides.tSearch : tSearch) {
            params.transfer_search = (overrides.tSearch !== undefined ? overrides.tSearch : tSearch).trim();
        }
        if (overrides.tStatus !== undefined ? overrides.tStatus : tStatus) {
            params.transfer_status = overrides.tStatus ?? tStatus;
        }
        if (overrides.dSearch !== undefined ? overrides.dSearch : dSearch) {
            params.disposal_search = (overrides.dSearch !== undefined ? overrides.dSearch : dSearch).trim();
        }
        if (overrides.dStatus !== undefined ? overrides.dStatus : dStatus) {
            params.disposal_status = overrides.dStatus ?? dStatus;
        }

        router.get(reportsIndexRoute().url, params, {
            preserveState: true,
            replace: true,
            only: ['transfers', 'disposals', 'filters'],
        });
    };

    const clearTFilters = () => {
        setTSearch('');
        setTStatus('');
        reload({ tSearch: '', tStatus: '' });
    };

    const clearDFilters = () => {
        setDSearch('');
        setDStatus('');
        reload({ dSearch: '', dStatus: '' });
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, replace: true });
    };

    const activeTCount = [tStatus].filter(Boolean).length + (tSearch ? 1 : 0);
    const activeDCount = [dStatus].filter(Boolean).length + (dSearch ? 1 : 0);

    return (
        <>
            <Head title="Laporan Mutasi & Penghapusan" />
            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <VibrantBackground variant="indigo" />
                <div className="mx-auto w-full max-w-7xl">
                    <div className={cn('ease-premium relative transition-all duration-200', isProcessing && 'pointer-events-none opacity-60')}>
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
                                <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                    <TrendingUp className="size-6" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Mutasi & Penghapusan</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ringkasan dan detail mutasi serta penghapusan aset.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card-enter mt-7 space-y-8 delay-100">
                            {/* Transfer Report Section */}
                            <section className="glass-panel rounded-2xl p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <History className="size-5 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold tracking-wide text-foreground">Laporan Mutasi Aset</h2>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                        <History className="size-3.5" strokeWidth={1.75} />
                                        {transfers.total}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                    <div className="group relative min-w-0 flex-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            value={tSearch}
                                            onChange={(e) => {
                                                setTSearch(e.target.value);
                                                if (tTimer.current) clearTimeout(tTimer.current);
                                                tTimer.current = setTimeout(() => reload({ tSearch: e.target.value }), 350);
                                            }}
                                            placeholder="Cari kode aset, serial number..."
                                            className="h-11! rounded-xl border-border/70 bg-card/70 pr-10 pl-10 text-sm shadow-sm backdrop-blur-xl"
                                        />
                                        {tSearch && (
                                            <button
                                                type="button"
                                                className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:scale-110 hover:bg-card hover:text-foreground"
                                                onClick={clearTFilters}
                                                aria-label="Bersihkan pencarian"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Select value={tStatus} onValueChange={(v) => { setTStatus(v); reload({ tStatus: v }); }}>
                                        <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-44">
                                            <Filter className="size-4 shrink-0 text-muted-foreground" />
                                            <SelectValue placeholder="Filter status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRANSFER_STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {transfers.data.length === 0 ? (
                                    <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-16 text-center delay-200">
                                        <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                            <Box className="size-7" strokeWidth={1.25} />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {activeTCount > 0 ? 'Tidak ada hasil' : 'Belum ada data mutasi'}
                                            </p>
                                        </div>
                                        {activeTCount > 0 && (
                                            <Button variant="outline" size="sm" onClick={clearTFilters} className="rounded-xl">
                                                <X className="mr-2 size-4" /> Hapus filter
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border/40">
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Aset</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Lokasi</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tanggal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {transfers.data.map((t) => (
                                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-foreground">{t.asset?.kode_asset ?? t.asset?.serial_number ?? '—'}</p>
                                                            <p className="text-xs text-muted-foreground">{t.asset?.brand} {t.asset?.model ?? ''}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {t.fromLocation?.name ?? '—'} → {t.toLocation?.name ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', TRANSFER_STATUS_COLORS[t.status] ?? 'bg-muted/50 text-muted-foreground')}>
                                                                {TRANSFER_STATUS_LABELS[t.status] ?? t.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {transfers.last_page > 1 && (
                                    <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                                        <p className="text-xs text-muted-foreground tabular-nums">Menampilkan {transfers.from}–{transfers.to} dari {transfers.total}</p>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={!transfers.links[0]?.url} onClick={() => goToPage(transfers.links[0]?.url)}>Sebelumnya</Button>
                                            {transfers.links.slice(1, -1).map((link, i) => (
                                                <Button key={i} variant={link.active ? 'default' : 'outline'} size="icon" className="h-9 w-9 rounded-xl" disabled={!link.url} onClick={() => goToPage(link.url)}>{link.label}</Button>
                                            ))}
                                            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={!transfers.links[transfers.links.length - 1]?.url} onClick={() => goToPage(transfers.links[transfers.links.length - 1]?.url)}>Selanjutnya</Button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Disposal Report Section */}
                            <section className="glass-panel rounded-2xl p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <ArchiveX className="size-5 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold tracking-wide text-foreground">Laporan Penghapusan Aset</h2>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                        <ArchiveX className="size-3.5" strokeWidth={1.75} />
                                        {disposals.total}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                                    <div className="group relative min-w-0 flex-1">
                                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <Input
                                            value={dSearch}
                                            onChange={(e) => {
                                                setDSearch(e.target.value);
                                                if (dTimer.current) clearTimeout(dTimer.current);
                                                dTimer.current = setTimeout(() => reload({ dSearch: e.target.value }), 350);
                                            }}
                                            placeholder="Cari kode aset, nama item..."
                                            className="h-11! rounded-xl border-border/70 bg-card/70 pr-10 pl-10 text-sm shadow-sm backdrop-blur-xl"
                                        />
                                        {dSearch && (
                                            <button
                                                type="button"
                                                className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:scale-110 hover:bg-card hover:text-foreground"
                                                onClick={clearDFilters}
                                                aria-label="Bersihkan pencarian"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Select value={dStatus} onValueChange={(v) => { setDStatus(v); reload({ dStatus: v }); }}>
                                        <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-44">
                                            <Filter className="size-4 shrink-0 text-muted-foreground" />
                                            <SelectValue placeholder="Filter status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DISPOSAL_STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {disposals.data.length === 0 ? (
                                    <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-16 text-center delay-200">
                                        <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                            <ArchiveX className="size-7" strokeWidth={1.25} />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {activeDCount > 0 ? 'Tidak ada hasil' : 'Belum ada data penghapusan'}
                                            </p>
                                        </div>
                                        {activeDCount > 0 && (
                                            <Button variant="outline" size="sm" onClick={clearDFilters} className="rounded-xl">
                                                <X className="mr-2 size-4" /> Hapus filter
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border/40">
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Aset</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Alasan</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tanggal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {disposals.data.map((d) => (
                                                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-foreground">{d.asset?.kode_asset ?? '—'}</p>
                                                            <p className="text-xs text-muted-foreground">{d.asset?.item?.name ?? '—'}</p>
                                                        </td>
                                                        <td className="px-4 py-3 line-clamp-2 text-muted-foreground">{d.reason ?? '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ring-1', DISPOSAL_STATUS_COLORS[d.status] ?? 'bg-slate-500/10 text-slate-600 ring-slate-500/20')}>
                                                                {DISPOSAL_STATUS_LABELS[d.status] ?? d.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(d.disposal_date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {disposals.last_page > 1 && (
                                    <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                                        <p className="text-xs text-muted-foreground tabular-nums">Menampilkan {disposals.from}–{disposals.to} dari {disposals.total}</p>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={!disposals.links[0]?.url} onClick={() => goToPage(disposals.links[0]?.url)}>Sebelumnya</Button>
                                            {disposals.links.slice(1, -1).map((link, i) => (
                                                <Button key={i} variant={link.active ? 'default' : 'outline'} size="icon" className="h-9 w-9 rounded-xl" disabled={!link.url} onClick={() => goToPage(link.url)}>{link.label}</Button>
                                            ))}
                                            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={!disposals.links[disposals.links.length - 1]?.url} onClick={() => goToPage(disposals.links[disposals.links.length - 1]?.url)}>Selanjutnya</Button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Laporan', href: reportsIndexRoute().url },
    ],
};