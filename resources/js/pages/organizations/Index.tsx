import { router, usePage } from '@inertiajs/react';
import { Building2, RefreshCw, Search, X } from 'lucide-react';
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
import { index as indexRoute, sync } from '@/routes/organizations';

type Tenant = {
    id: string;
    name: string;
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
    tenants: PaginatedData<Tenant>;
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function OrganizationsIndex() {
    const { tenants } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState('');
    const [syncOpen, setSyncOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

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
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                !(target instanceof HTMLInputElement) &&
                !(target instanceof HTMLTextAreaElement) &&
                !target?.isContentEditable
            ) {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const reload = (params: { search?: string }) => {
        router.get(indexRoute().url, params.search ? params : {}, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                if (params.search !== undefined) {
                    searchInputRef.current?.focus();
                }
            },
        });
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
            <VibrantBackground variant="indigo" />
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
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Building2
                                    className="size-6"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Organisasi
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Data organisasi / tenant, disinkronkan dari
                                    Portal Optigate.
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchInputRef}
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);

                                        if (searchTimer.current) {
                                            clearTimeout(searchTimer.current);
                                        }

                                        searchTimer.current = setTimeout(
                                            () =>
                                                reload({
                                                    search: e.target.value,
                                                }),
                                            300,
                                        );
                                    }}
                                    placeholder="Cari organisasi... ( / )"
                                    className="pl-9"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Hapus pencarian"
                                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                                {tenants.total} organisasi
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                        <th className="px-4 py-3 font-semibold">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Nama
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Disinkronkan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.data.map((tenant) => (
                                        <tr
                                            key={tenant.id}
                                            className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {tenant.id}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {tenant.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {formatDate(tenant.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <Building2 className="size-8 text-muted-foreground/50" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Belum ada organisasi.
                                                        Sinkronkan data dari
                                                        Portal untuk mengisi
                                                        daftar.
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSyncOpen(true)
                                                        }
                                                        className="mt-2"
                                                    >
                                                        <RefreshCw className="mr-2 size-4" />
                                                        Sinkronkan
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {tenants.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!tenants.links[0]?.url}
                                    onClick={() =>
                                        goToPage(tenants.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {tenants.links.slice(1, -1).map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => goToPage(link.url)}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        !tenants.links[tenants.links.length - 1]
                                            ?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            tenants.links[
                                                tenants.links.length - 1
                                            ]?.url,
                                        )
                                    }
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                open={syncOpen}
                onOpenChange={(open) => !open && setSyncOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sinkronisasi Organisasi</DialogTitle>
                        <DialogDescription>
                            Data organisasi akan diperbarui dari Portal
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
