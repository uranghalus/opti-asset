import { router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    History,
    Inbox,
    Pencil,
    Plus,
    Search,
    Trash2,
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
import { VibrantBackground } from '@/components/vibrant-background';
import { cn } from '@/lib/utils';
import { index as indexRoute } from '@/routes/audit-logs';

type ActivityLogEntry = {
    id: string;
    user_name: string | null;
    action: string;
    subject_type: string;
    subject_label: string | null;
    properties: Record<string, { old: unknown; new: unknown }> | null;
    created_at: string;
};

type PaginatedLogs = {
    data: ActivityLogEntry[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    logs: PaginatedLogs;
    filters: {
        search: string;
        action: string;
        type: string;
    };
    types: string[];
};

const ACTION_LABELS: Record<string, string> = {
    created: 'Dibuat',
    updated: 'Diubah',
    deleted: 'Dihapus',
};

const ACTION_STYLES: Record<string, string> = {
    created:
        'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    updated:
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    deleted: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'ya' : 'tidak';
    }

    const text = String(value);

    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

export default function AuditLogsIndex() {
    const page = usePage().props as unknown as PageProps;
    const { logs, types } = page;

    const [search, setSearch] = useState(page.filters.search);
    const [actionFilter, setActionFilter] = useState(page.filters.action);
    const [typeFilter, setTypeFilter] = useState(page.filters.type);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        if (actionFilter) {
            params.action = actionFilter;
        }

        if (typeFilter) {
            params.type = typeFilter;
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['logs', 'filters'],
            },
        );
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const hasActiveFilters = Boolean(
        search.trim() || actionFilter || typeFilter,
    );

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 sm:p-6 lg:p-8">
            <VibrantBackground variant="default" />
            <div className="mx-auto w-full max-w-6xl">
                <div className="card-enter flex items-center gap-3">
                    <div className="glass-card flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10 sm:size-12">
                        <History
                            className="size-5 sm:size-6"
                            strokeWidth={1.5}
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Audit Log
                        </h1>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                            Jejak aktivitas perubahan data organisasi.
                        </p>
                    </div>
                </div>

                <div className="glass-panel card-enter mt-5 flex flex-col gap-2.5 rounded-2xl p-3 delay-100 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
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
                                        reload({ search: event.target.value }),
                                    350,
                                );
                            }}
                            placeholder="Cari pengguna atau objek..."
                            className="h-12! rounded-xl border-border/70 bg-card/70 pr-10 pl-10 text-base shadow-sm backdrop-blur-xl sm:h-11! sm:text-sm"
                        />
                        {search ? (
                            <button
                                type="button"
                                className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-card hover:text-foreground"
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
                        value={actionFilter || 'all'}
                        onValueChange={(value) => {
                            const next = value === 'all' ? '' : value;
                            setActionFilter(next);
                            reload({ action: next });
                        }}
                    >
                        <SelectTrigger className="h-12! w-full rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:h-11! sm:w-40">
                            <SelectValue placeholder="Semua Aksi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Aksi</SelectItem>
                            <SelectItem value="created">Dibuat</SelectItem>
                            <SelectItem value="updated">Diubah</SelectItem>
                            <SelectItem value="deleted">Dihapus</SelectItem>
                        </SelectContent>
                    </Select>

                    {types.length > 0 && (
                        <Select
                            value={typeFilter || 'all'}
                            onValueChange={(value) => {
                                const next = value === 'all' ? '' : value;
                                setTypeFilter(next);
                                reload({ type: next });
                            }}
                        >
                            <SelectTrigger className="h-12! w-full rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:h-11! sm:w-44">
                                <SelectValue placeholder="Semua Objek" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Objek</SelectItem>
                                {types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSearch('');
                                setActionFilter('');
                                setTypeFilter('');
                                reload({ search: '', action: '', type: '' });
                            }}
                            className="size-12! shrink-0 rounded-xl sm:size-11!"
                            aria-label="Hapus filter"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>

                <p className="card-enter mt-4 text-xs text-muted-foreground tabular-nums delay-150">
                    {logs.total} aktivitas tercatat
                </p>

                {logs.data.length === 0 ? (
                    <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                        <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                            <Inbox className="size-7" strokeWidth={1.25} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground">
                                {hasActiveFilters
                                    ? 'Tidak ada aktivitas cocok'
                                    : 'Belum ada aktivitas'}
                            </p>
                            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                {hasActiveFilters
                                    ? 'Coba kata kunci atau filter lain.'
                                    : 'Aktivitas tambah, ubah, dan hapus data akan tercatat otomatis di sini.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabel desktop */}
                        <div className="glass-panel card-enter mt-4 hidden overflow-hidden rounded-2xl delay-200 md:block">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border/40 text-xs tracking-wide text-muted-foreground uppercase">
                                        <th className="px-4 py-3 font-semibold">
                                            Waktu
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Pengguna
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Aksi
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Objek
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Detail
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b border-border/30 transition-colors last:border-0 hover:bg-accent/30"
                                        >
                                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {log.user_name ?? 'Sistem'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
                                                        ACTION_STYLES[
                                                            log.action
                                                        ] ??
                                                            'bg-slate-500/10 text-muted-foreground ring-slate-500/20',
                                                    )}
                                                >
                                                    {ACTION_LABELS[
                                                        log.action
                                                    ] ?? log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {log.subject_label ?? '—'}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {log.subject_type}
                                                </p>
                                            </td>
                                            <td className="max-w-xs px-4 py-3">
                                                <PropertyList log={log} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Kartu mobile */}
                        <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
                            {logs.data.map((log) => (
                                <div
                                    key={log.id}
                                    className="glass-card ease-premium rounded-2xl p-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {log.subject_label ??
                                                    log.subject_type}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {log.user_name ?? 'Sistem'} ·{' '}
                                                {log.subject_type}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
                                                ACTION_STYLES[log.action] ??
                                                    'bg-slate-500/10 text-muted-foreground ring-slate-500/20',
                                            )}
                                        >
                                            {ACTION_LABELS[log.action] ??
                                                log.action}
                                        </span>
                                    </div>
                                    <PropertyList log={log} className="mt-3" />
                                    <p className="mt-3 border-t border-border/40 pt-2 text-[10px] text-muted-foreground tabular-nums">
                                        {formatDateTime(log.created_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {logs.last_page > 1 && (
                    <div className="card-enter mt-6 flex items-center justify-between gap-3 pb-2 delay-200">
                        <p className="text-xs text-muted-foreground tabular-nums">
                            {logs.from}–{logs.to}
                            <span className="hidden sm:inline"> dari </span>
                            <span className="sm:hidden"> / </span>
                            {logs.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-10 rounded-xl sm:size-9"
                                disabled={!logs.links[0]?.url}
                                onClick={() => goToPage(logs.links[0]?.url)}
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-14 text-center text-sm font-semibold text-foreground tabular-nums">
                                {logs.current_page}
                                <span className="text-muted-foreground">
                                    {' '}
                                    / {logs.last_page}
                                </span>
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-10 rounded-xl sm:size-9"
                                disabled={
                                    !logs.links[logs.links.length - 1]?.url
                                }
                                onClick={() =>
                                    goToPage(
                                        logs.links[logs.links.length - 1]?.url,
                                    )
                                }
                                aria-label="Halaman berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PropertyList({
    log,
    className,
}: {
    log: ActivityLogEntry;
    className?: string;
}) {
    const entries = Object.entries(log.properties ?? {});

    if (entries.length === 0) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 text-xs text-muted-foreground',
                    className,
                )}
            >
                {log.action === 'created' && (
                    <>
                        <Plus className="size-3" /> data baru
                    </>
                )}
                {log.action === 'deleted' && (
                    <>
                        <Trash2 className="size-3" /> dihapus
                    </>
                )}
                {!['created', 'updated'].includes(log.action) &&
                    log.action !== 'deleted' &&
                    '—'}
            </span>
        );
    }

    return (
        <div className={cn('space-y-1', className)}>
            {entries.slice(0, 3).map(([field, change]) => (
                <p
                    key={field}
                    className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground"
                >
                    {log.action === 'updated' && (
                        <Pencil className="size-3 shrink-0" strokeWidth={2} />
                    )}
                    <span className="shrink-0">{field}:</span>
                    <span className="truncate line-through opacity-70">
                        {formatValue(change.old)}
                    </span>
                    <span>→</span>
                    <span className="truncate text-foreground">
                        {formatValue(change.new)}
                    </span>
                </p>
            ))}
            {entries.length > 3 && (
                <p className="text-[11px] text-muted-foreground">
                    +{entries.length - 3} field lainnya
                </p>
            )}
        </div>
    );
}

AuditLogsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Audit Log',
            href: indexRoute().url,
        },
    ],
};
