import { Link, router, usePage } from '@inertiajs/react';
import {
    ArchiveX,
    ChevronRight,
    Eye,
    Inbox,
    Package,
    Pencil,
    Plus,
    Search,
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
    destroy,
    edit as editRoute,
    index as indexRoute,
    show as showRoute,
} from '@/routes/disposals';

type Disposal = {
    id: number;
    asset: { id: string; kode_asset: string | null; nama_asset: string | null } | null;
    disposedBy: { id: number; name: string } | null;
    reason: string | null;
    disposal_date: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
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

type PageProps = {
    disposals: PaginatedData<Disposal>;
    filters: {
        search: string;
        status: string;
    };
};

const STATUS_STYLES: Record<string, string> = {
    pending:
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    approved:
        'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    rejected: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

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

export default function DisposalsIndex() {
    const { disposals, filters } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [deleting, setDeleting] = useState<Disposal | null>(null);
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

        if (statusFilter) {
            params.status = statusFilter;
        }

        router.get(indexRoute().url, { ...params, ...overrides }, {
            preserveState: true,
            replace: true,
            only: ['disposals', 'filters'],
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        reload({ search: '', status: '' });
    };

    const handleDelete = () => {
        if (!deleting) {
            return;
        }

        setDeletingState(true);
        router.delete(destroy(deleting.id).url, {
            only: ['disposals'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeletingState(false);
                setDeleting(null);
                toast.success('Penghapusan aset berhasil dihapus.');
            },
            onError: () => {
                setDeletingState(false);
                toast.error('Gagal menghapus penghapusan aset.');
            },
        });
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const activeFilterCount = [statusFilter].filter(Boolean).length;

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
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <ArchiveX className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Penghapusan Aset
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Ajukan dan pantau penghapusan aset
                                    organisasi.
                                </p>
                            </div>
                        </div>

                        <Link href="/disposals/create">
                            <Button
                                size="sm"
                                className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                            >
                                <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                    <Plus className="size-3.5" strokeWidth={2.25} />
                                </span>
                                Ajukan Penghapusan
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
                                placeholder="Cari kode aset atau nama aset..."
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
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(value) => {
                                    setStatusFilter(value === 'all' ? '' : value);
                                    reload({ status: value === 'all' ? '' : value });
                                }}
                            >
                                <SelectTrigger className="h-11! w-44 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Menunggu
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Disetujui
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        Ditolak
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {activeFilterCount > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearFilters}
                                    className="h-11! w-11 shrink-0 rounded-xl"
                                    aria-label="Hapus semua filter"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Daftar Penghapusan
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                            <ArchiveX className="size-3.5" strokeWidth={1.75} />
                            {disposals.total}
                        </span>
                    </div>

                    {disposals.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {activeFilterCount > 0 || search
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada penghapusan aset'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {activeFilterCount > 0 || search
                                        ? 'Tidak ditemukan penghapusan aset dengan filter tersebut.'
                                        : 'Ajukan penghapusan aset pertama Anda untuk mulai mencatat disposisi.'}
                                </p>
                            </div>
                            <Link href="/disposals/create">
                                <Button size="sm" className="rounded-xl">
                                    <Plus className="mr-2 size-4" />
                                    Ajukan Penghapusan
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {disposals.data.map((disposal) => (
                                <div
                                    key={disposal.id}
                                    className="glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="relative size-11 shrink-0">
                                                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                                    <Package
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    href={showRoute(disposal.id).url}
                                                    className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                                                >
                                                    {disposal.asset?.nama_asset ??
                                                        'Aset'}
                                                </Link>
                                                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                                    {disposal.asset?.kode_asset ??
                                                        '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Link
                                                href={editRoute(disposal.id).url}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    aria-label="Edit penghapusan"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() =>
                                                    setDeleting(disposal)
                                                }
                                                aria-label="Hapus penghapusan"
                                            >
                                                <Trash2 className="size-3.5 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
                                        <span
                                            className={cn(
                                                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
                                                STATUS_STYLES[
                                                    disposal.status
                                                ] ??
                                                    'bg-slate-500/10 text-slate-600 ring-slate-500/20',
                                            )}
                                        >
                                            {STATUS_LABELS[disposal.status] ??
                                                disposal.status}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {formatDate(disposal.disposal_date)}
                                        </span>
                                    </div>

                                    <div className="relative mt-3.5 flex flex-1 flex-col gap-2">
                                        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
                                            {disposal.reason ??
                                                'Tidak ada alasan.'}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                                            <span className="truncate text-[10px] text-muted-foreground">
                                                {disposal.disposedBy?.name ??
                                                    '—'}
                                            </span>
                                            <Link
                                                href={showRoute(disposal.id).url}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary transition-colors hover:text-primary/80"
                                            >
                                                Detail
                                                <ChevronRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {disposals.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Menampilkan {disposals.from}–{disposals.to} dari{' '}
                                {disposals.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!disposals.links[0]?.url}
                                    onClick={() =>
                                        goToPage(disposals.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {disposals.links.slice(1, -1).map((link, i) => (
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
                                        !disposals.links[
                                            disposals.links.length - 1
                                        ]?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            disposals.links[
                                                disposals.links.length - 1
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

            <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Penghapusan Aset</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengajuan
                            penghapusan aset ini? Tindakan tidak dapat
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleting(null)}
                            disabled={deletingState}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletingState}
                            className="gap-2"
                        >
                            {deletingState && <Spinner className="size-4" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
