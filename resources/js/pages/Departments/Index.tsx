import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarClock,
    Inbox,
    Network,
    RefreshCw,
    Search,
    Users,
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
import { Spinner } from '@/components/ui/spinner';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import { index as indexRoute, show, sync } from '@/routes/departments';

type Department = {
    id_department: string;
    kode_department: string;
    nama_department: string | null;
    employees_count: number;
    created_at: string;
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
    departments: PaginatedData<Department>;
    filters: { search: string | null };
};

const ACCENTS = [
    {
        tile: 'from-amber-500 to-orange-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(245,158,11,0.22),transparent_60%)]',
        icon: 'text-amber-600 dark:text-amber-400',
        bar: 'from-amber-400 to-orange-500',
        badge: 'from-amber-500/10 to-orange-600/10 text-amber-700 ring-amber-500/10 dark:text-amber-300',
    },
    {
        tile: 'from-emerald-500 to-teal-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(16,185,129,0.22),transparent_60%)]',
        icon: 'text-emerald-600 dark:text-emerald-400',
        bar: 'from-emerald-400 to-teal-500',
        badge: 'from-emerald-500/10 to-teal-600/10 text-emerald-700 ring-emerald-500/10 dark:text-emerald-300',
    },
    {
        tile: 'from-sky-500 to-blue-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(56,189,248,0.22),transparent_60%)]',
        icon: 'text-sky-600 dark:text-sky-400',
        bar: 'from-sky-400 to-blue-500',
        badge: 'from-sky-500/10 to-blue-600/10 text-sky-700 ring-sky-500/10 dark:text-sky-300',
    },
];

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function DepartmentsIndex() {
    const { departments, filters } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');
    const [prevSearch, setPrevSearch] = useState(filters.search);
    const [syncOpen, setSyncOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

    if (filters.search !== prevSearch) {
        setPrevSearch(filters.search);
        setSearch(filters.search ?? '');
    }

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                event.key === '/' &&
                target?.tagName !== 'INPUT' &&
                target?.tagName !== 'TEXTAREA' &&
                !target?.isContentEditable
            ) {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const reload = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {};

        if (search.trim()) {
            params.search = search.trim();
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['departments', 'filters'],
            },
        );
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

    const clearSearch = () => {
        setSearch('');
        reload({ search: '' });
        searchInputRef.current?.focus();
    };

    const handleSync = () => {
        setSyncing(true);
        setSyncOpen(false);
        router.post(
            sync().url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSyncing(false),
            },
        );
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    return (
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
                                <Network className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Department
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Struktur departemen organisasi Anda,
                                    disinkronkan dari Portal Optigate.
                                </p>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setSyncOpen(true)}
                            disabled={syncing}
                            className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                        >
                            <RefreshCw
                                className={cn(
                                    'size-4 transition-transform duration-300 group-hover:rotate-180',
                                    syncing && 'animate-spin',
                                )}
                            />
                            {syncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
                        </Button>
                    </div>

                    <div className="glass-panel card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100">
                        <div className="group relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                ref={searchInputRef}
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Cari nama atau kode department..."
                                className="h-11! rounded-xl border-border/70 bg-card/70 pr-16 pl-10 text-sm text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md focus:ring-primary/25"
                            />
                            {search ? (
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-card hover:text-foreground active:scale-95"
                                    onClick={clearSearch}
                                    aria-label="Bersihkan pencarian"
                                >
                                    <X className="size-4" />
                                </button>
                            ) : (
                                <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center rounded-md border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground transition-colors group-focus-within:border-primary/30 group-focus-within:text-primary/70 sm:inline-flex">
                                    /
                                </kbd>
                            )}
                        </div>
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Semua Department
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                            <Building2
                                className="size-3.5"
                                strokeWidth={1.75}
                            />
                            {departments.total}
                        </span>
                    </div>

                    {departments.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {search.trim()
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada department'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search.trim()
                                        ? `Tidak ditemukan department untuk "${search}". Coba kata kunci lain.`
                                        : 'Sinkronkan data dari Portal Optigate untuk memuat struktur department organisasi Anda.'}
                                </p>
                            </div>
                            {search.trim() ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSearch}
                                    className="rounded-xl"
                                >
                                    <X className="mr-2 size-4" />
                                    Hapus filter
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => setSyncOpen(true)}
                                    className="rounded-xl"
                                >
                                    <RefreshCw className="mr-2 size-4" />
                                    Sinkronisasi Portal
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {departments.data.map((department, index) => {
                                const accent = ACCENTS[index % ACCENTS.length];

                                return (
                                    <Link
                                        key={department.id_department}
                                        href={show(department).url}
                                        className="group block"
                                    >
                                        <div className="glass-card ease-premium relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]">
                                            <div
                                                aria-hidden
                                                className={cn(
                                                    'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-60 transition-opacity duration-300 group-hover:opacity-100',
                                                    accent.bar,
                                                )}
                                            />
                                            <div
                                                aria-hidden
                                                className={cn(
                                                    'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                                                    accent.glow,
                                                )}
                                            />
                                            <div className="relative flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3.5">
                                                    <div
                                                        className={cn(
                                                            'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3',
                                                            accent.tile,
                                                        )}
                                                    >
                                                        <Building2
                                                            className="size-5"
                                                            strokeWidth={1.75}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-semibold text-foreground">
                                                            {department.nama_department ??
                                                                '—'}
                                                        </h3>
                                                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                                            {
                                                                department.kode_department
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                                            </div>

                                            <div className="relative mt-4 flex flex-1 items-end justify-between gap-3 border-t border-border/60 pt-3.5">
                                                <p
                                                    className={cn(
                                                        'flex items-center gap-1.5 text-xs font-medium',
                                                        accent.icon,
                                                    )}
                                                >
                                                    <Users
                                                        className="size-3.5"
                                                        strokeWidth={2}
                                                    />
                                                    {department.employees_count}{' '}
                                                    karyawan
                                                </p>
                                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CalendarClock
                                                        className="size-3.5"
                                                        strokeWidth={2}
                                                    />
                                                    {formatDate(
                                                        department.created_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {departments.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Menampilkan {departments.from}–{departments.to}{' '}
                                dari {departments.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!departments.links[0]?.url}
                                    onClick={() =>
                                        goToPage(departments.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {departments.links
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
                                        !departments.links[
                                            departments.links.length - 1
                                        ]?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            departments.links[
                                                departments.links.length - 1
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
                open={syncOpen}
                onOpenChange={(open) => !open && setSyncOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sinkronisasi Department</DialogTitle>
                        <DialogDescription>
                            Data department akan diperbarui dari Portal
                            Optigate. Proses ini dapat mengubah data yang ada.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSyncOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSync}
                            className="min-w-24"
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Sinkronkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Department',
            href: indexRoute().url,
        },
    ],
};
