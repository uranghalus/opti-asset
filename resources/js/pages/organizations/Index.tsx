import { router, usePage } from '@inertiajs/react';
import { Building2, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import { index as tenantsIndex } from '@/routes/tenants';

type Tenant = {
    id: string;
    code: string;
    name: string;
    optigate_company_id: string | null;
    is_active: boolean;
    deactivated_at: string | null;
    created_at: string;
    updated_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PageProps = {
    tenants: {
        data: Tenant[];
        current_page: number;
        first_page_url: string | null;
        from: number | null;
        last_page: number;
        last_page_url: string | null;
        links: PaginationLink[];
        next_page_url: string | null;
        path: string;
        per_page: number;
        prev_page_url: string | null;
        to: number | null;
        total: number;
    };
};

export default function OrganizationsIndex() {
    const { tenants } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState('');
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
            if (
                event.key === '/' &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                !(event.target as HTMLElement)?.isContentEditable
            ) {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    const reload = (params: { search?: string }) => {
        router.get(tenantsIndex().url, params.search ? params : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearch('');
        reload({ search: '' });
        searchInputRef.current?.focus();
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <VibrantBackground className="pointer-events-none" />

            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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

                <div className="glass-panel card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                ref={searchInputRef}
                                placeholder="Cari organisasi... ( / )"
                                className="pl-9"
                            />
                            {search.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Hapus pencarian"
                                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-text-primary"
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
                                                </p>
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
                                tenants.active === link.url ? (
                                    <Button
                                        key={i}
                                        onClick={() => goToPage(link.url)}
                                        className="relative inline-flex items-center justify-center border border-border-subtle bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                                    >
                                        {link.label}
                                    </Button>
                                ) : (
                                    <Button
                                        key={i}
                                        onClick={() => goToPage(link.url)}
                                        className={cn(
                                            'relative inline-flex items-center border border-border-subtle bg-white px-3 py-2 text-sm font-medium text-text-primary shadow-sm hover:bg-muted',
                                            tenants.active === link.url &&
                                                'bg-primary text-primary-foreground',
                                        )}
                                    >
                                        {link.label}
                                    </Button>
                                )
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!tenants.links[tenants.links.length - 1]?.url}
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
    );
}
