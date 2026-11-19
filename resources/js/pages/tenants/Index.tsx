import { router, usePage } from '@inertiajs/react';
import { RefreshCw, Search, X, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { VibrantBackground } from '@/components/vibrant-background';
import { cn } from '@/lib/utils';
import { index as tenantsIndex, store as tenantsStore, sync as tenantsSync } from '@/routes/tenants';

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

type SyncResult = {
    success: boolean;
    created: number;
    updated: number;
    deactivated: number;
    reactivated: number;
    total: number;
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
    syncResult?: SyncResult | null;
};

export default function TenantsIndex() {
    const { tenants, syncResult } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState('');
    const [syncOpen, setSyncOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Show sync result toast when syncResult is present (from successful sync redirect)
    useEffect(() => {
        if (syncResult && syncResult.total > 0) {
            toast.success(
                `Sinkronisasi selesai! ${syncResult.total} data tenant diproses`,
                {
                    description: `Dibuat: ${syncResult.created}, Diperbarui: ${syncResult.updated}, Dinonaktifkan: ${syncResult.deactivated}, Diaktifkan kembali: ${syncResult.reactivated}`,
                },
            );
        }
    }, [syncResult]);

    // Show sync error toast when error is present
    useEffect(() => {
        if (syncError) {
            toast.error(syncError, {
                description: 'Periksa konfigurasi portal atau coba lagi nanti.',
            });
        }
    }, [syncError]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            router.get(tenantsIndex({ query: { search: value } }).url, {
                preserveScroll: true,
                replace: true,
            });
        }, 300);
    };

    const handleSync = () => {
        setSyncing(true);
        setSyncOpen(false);
        setSyncError(null);

        router.post(
            tenantsSync().url,
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const result = (page.props as unknown as PageProps).syncResult;

                    if (result && result.total > 0) {
                        toast.success(
                            `Sinkronisasi selesai! ${result.total} data tenant diproses`,
                            {
                                description: `Dibuat: ${result.created}, Diperbarui: ${result.updated}, Dinonaktifkan: ${result.deactivated}, Diaktifkan kembali: ${result.reactivated}`,
                            },
                        );
                    }
                },
                onError: () => {
                    setSyncError('Gagal mensinkronkan tenant dari API Portal.');
                },
                onFinish: () => setSyncing(false),
            },
        );
    };

    const handleClose = () => {
        setSyncOpen(false);
    };

    const handleStore = () => {
        router.post(
            tenantsStore().url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tenant berhasil ditambahkan.');
                    setSyncOpen(false);
                },
                onError: () => {
                    toast.error('Gagal menambahkan tenant.');
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <VibrantBackground className="absolute inset-0" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Unit Bisnis</h1>
                        <p className="text-muted-foreground">
                            Kelola unit bisnis (tenant) yang disinkronkan dari Optigate Portal.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2"
                        >
                            {syncing ? (
                                <>
                                    <Spinner className="w-4 h-4" />
                                    Memuat...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Sinkronkan dari Portal
                                </>
                            )}
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            onClick={handleStore}
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Tenant
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <Input
                        ref={searchInputRef}
                        placeholder="Cari nama atau kode tenant..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full sm:w-80"
                    >
                        <Search className="ml-3 h-4 w-4 text-muted-foreground" />
                    </Input>
                </div>

                {/* Sync error alert */}
                {syncError && (
                    <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-sm text-destructive">{syncError}</span>
                            <Button variant="outline" size="sm" onClick={() => setSyncError(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tenants table */}
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-border text-muted-foreground">
                                <th className="pb-3 font-medium">Kode</th>
                                <th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">ID Optigate</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.data.map((tenant) => (
                                <tr key={tenant.id} className="border-b border-border last:border-0">
                                    <td className="py-3 font-mono text-sm">{tenant.code}</td>
                                    <td className="py-3">{tenant.name}</td>
                                    <td className="py-3 font-mono text-xs text-muted-foreground">
                                        {tenant.optigate_company_id ?? '-'}
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                                tenant.is_active
                                                    ? 'bg-green-50/50 text-green-700 border border-green-100'
                                                    : 'bg-red-50/50 text-red-700 border border-red-100',
                                            )}
                                        >
                                            {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {tenants.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                        Tidak ada data tenant.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {tenants.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">
                                Menampilkan {tenants.from}–{tenants.to} dari {tenants.total} data
                            </p>
                            <div className="flex gap-1">
                                {tenants.links.map((link) => (
                                    <Button
                                        key={link.label}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url || link.active}
                                        onClick={() => {
                                            if (link.url) {
                                                const url = new URL(link.url, window.location.origin);
                                                const page = url.searchParams.get('page');

                                                if (page) {
                                                    router.get(tenantsIndex({ query: { page } }).url, {
                                                        preserveScroll: true,
                                                        replace: true,
                                                    });
                                                }
                                            }
                                        }}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Tenant Dialog */}
            <dialog
                open={syncOpen}
                onChange={handleClose}
                className="modal-backdrop"
            >
                <div className="modal-panel">
                    <div className="modal-header">
                        <h3 className="text-lg font-semibold">Tambah Tenant</h3>
                        <button onClick={handleClose} className="modal-close">
                            <X />
                        </button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleStore();
                        }}>
                            <div className="space-y-4">
                                <div className="form-field">
                                    <label className="form-label">Nama Tenant</label>
                                    <Input
                                        placeholder="Masukkan nama tenant"
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Kode Tenant</label>
                                    <Input
                                        placeholder="Masukkan kode tenant (slug)"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    Batal
                                </Button>
                                <Button type="submit">Simpan</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
