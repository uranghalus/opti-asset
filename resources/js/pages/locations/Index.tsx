import { router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Inbox,
    MapPin,
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
import { Label } from '@/components/ui/label';
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
    destroy,
    index as indexRoute,
    store,
    update,
} from '@/routes/locations';

type Location = {
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

type Filters = {
    search: string;
    sort: string;
};

type PageProps = {
    locations: PaginatedData<Location>;
    filters: Filters;
};

const SORT_OPTIONS = [
    { value: '', label: 'Terbaru' },
    { value: 'name', label: 'Nama (A–Z)' },
    { value: '-name', label: 'Nama (Z–A)' },
];

const ACCENTS = [
    {
        tile: 'from-sky-500 to-blue-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(56,189,248,0.22),transparent_60%)]',
        icon: 'text-sky-600 dark:text-sky-400',
    },
    {
        tile: 'from-violet-500 to-indigo-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(139,92,246,0.22),transparent_60%)]',
        icon: 'text-violet-600 dark:text-violet-400',
    },
    {
        tile: 'from-teal-500 to-cyan-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(45,212,191,0.22),transparent_60%)]',
        icon: 'text-teal-600 dark:text-teal-400',
    },
];

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function LocationsIndex() {
    const { locations, filters } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [sort, setSort] = useState(filters.sort);
    const [prevFilters, setPrevFilters] = useState(filters);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Location | null>(null);
    const [deleting, setDeleting] = useState<Location | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    const form = useForm<{ name: string }>({ name: '' });

    if (
        filters.search !== prevFilters.search ||
        filters.sort !== prevFilters.sort
    ) {
        setPrevFilters(filters);
        setSearch(filters.search);
        setSort(filters.sort);
    }

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

    const reload = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {};

        if (search.trim()) {
            params.search = search.trim();
        }

        if (sort) {
            params.sort = sort;
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['locations', 'filters'],
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

    const handleSortChange = (value: string) => {
        setSort(value);
        reload({ sort: value });
    };

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setFormOpen(true);
    };

    const openEdit = (location: Location) => {
        setEditing(location);
        form.setData('name', location.name);
        setFormOpen(true);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            only: ['locations', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                toast.success(
                    editing
                        ? 'Lokasi berhasil diperbarui.'
                        : 'Lokasi berhasil ditambahkan.',
                );
            },
            onError: () => {
                toast.error('Periksa kembali data yang diisi.');
            },
        };

        if (editing) {
            form.patch(update(editing.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    const handleDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(destroy(deleting.id).url, {
            only: ['locations', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(null);
                toast.success('Lokasi berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus lokasi.');
            },
        });
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const activeSort = SORT_OPTIONS.find((option) => option.value === sort);

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <VibrantBackground variant="default" />
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
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl text-primary shadow-md">
                                <MapPin className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Lokasi
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelola lokasi penyimpanan aset organisasi
                                    Anda.
                                </p>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={openCreate}
                            className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                        >
                            <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                <Plus className="size-3.5" strokeWidth={2.25} />
                            </span>
                            Tambah Lokasi
                        </Button>
                    </div>

                    <div className="card-enter mt-7 flex flex-col gap-3 delay-100 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Cari lokasi..."
                                className="h-11 rounded-xl border-border/70 bg-card/70 pr-10 pl-10 text-sm text-foreground shadow-sm backdrop-blur-xl transition-shadow placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                    onClick={() => {
                                        setSearch('');
                                        reload({ search: '' });
                                    }}
                                    aria-label="Bersihkan pencarian"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <Select value={sort} onValueChange={handleSortChange}>
                            <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-52">
                                <SelectValue
                                    placeholder={activeSort?.label ?? 'Urutkan'}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((option) => (
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

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Semua Lokasi
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <MapPin className="size-3.5" strokeWidth={1.75} />
                            {locations.total}
                        </span>
                    </div>

                    {locations.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {search
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada lokasi'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search
                                        ? `Tidak ditemukan lokasi untuk "${search}". Coba kata kunci lain.`
                                        : 'Buat lokasi pertama untuk mulai memetakan tempat penyimpanan aset Anda.'}
                                </p>
                            </div>
                            {search ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        reload({ search: '' });
                                    }}
                                    className="rounded-xl"
                                >
                                    <X className="mr-2 size-4" />
                                    Hapus filter
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={openCreate}
                                    className="rounded-xl"
                                >
                                    <Plus className="mr-2 size-4" />
                                    Tambah Lokasi
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {locations.data.map((location, index) => {
                                const accent = ACCENTS[index % ACCENTS.length];

                                return (
                                    <div
                                        key={location.id}
                                        className="glass-card group ease-premium relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                    >
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
                                                        'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3',
                                                        accent.tile,
                                                    )}
                                                >
                                                    <MapPin
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {location.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-0.5 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                    onClick={() =>
                                                        openEdit(location)
                                                    }
                                                    aria-label={`Edit ${location.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleting(location)
                                                    }
                                                    aria-label={`Hapus ${location.name}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="relative mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                                            <p
                                                className={cn(
                                                    'flex items-center gap-1.5 text-xs font-medium',
                                                    accent.icon,
                                                )}
                                            >
                                                <CalendarClock
                                                    className="size-3.5"
                                                    strokeWidth={2}
                                                />
                                                Dibuat{' '}
                                                {formatDate(
                                                    location.created_at,
                                                )}
                                            </p>
                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                #
                                                {(locations.from + index)
                                                    .toString()
                                                    .padStart(3, '0')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {locations.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {locations.from}–{locations.to} dari{' '}
                                {locations.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!locations.links[0]?.url}
                                    onClick={() =>
                                        goToPage(locations.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {locations.links.slice(1, -1).map((link, i) => (
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
                                        !locations.links[
                                            locations.links.length - 1
                                        ]?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            locations.links[
                                                locations.links.length - 1
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
                open={formOpen}
                onOpenChange={(open) => !open && setFormOpen(false)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Lokasi' : 'Tambah Lokasi'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui informasi lokasi.'
                                : 'Buat lokasi penyimpanan aset baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="location-name">Nama Lokasi</Label>
                            <Input
                                id="location-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Contoh: Gudang Pusat"
                                autoFocus
                                required
                            />
                            {form.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={form.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="min-w-24"
                            >
                                {form.processing ? (
                                    <Spinner className="mr-2 size-4" />
                                ) : null}
                                {editing ? 'Simpan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Lokasi</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus &ldquo;{deleting?.name}
                            &rdquo;? Tindakan ini tidak dapat dibatalkan.
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
                        >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

LocationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Lokasi',
            href: indexRoute().url,
        },
    ],
};
