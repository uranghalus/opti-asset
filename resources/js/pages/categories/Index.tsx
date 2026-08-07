import { router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    CalendarClock,
    FolderTree,
    Hash,
    Inbox,
    Pencil,
    Plus,
    Search,
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
import { Label } from '@/components/ui/label';
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
    index as indexRoute,
    store,
    update,
} from '@/routes/categories';

type Group = {
    id: string;
    name: string;
};

type Category = {
    id: string;
    asset_group_id: string;
    code: string | null;
    name: string;
    description: string | null;
    created_at: string;
    asset_group: Group | null;
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
    group: string;
};

type PageProps = {
    categories: PaginatedData<Category>;
    groups: Group[];
    filters: Filters;
};

const SORT_OPTIONS = [
    { value: '', label: 'Terbaru' },
    { value: 'name', label: 'Nama (A–Z)' },
    { value: '-name', label: 'Nama (Z–A)' },
    { value: 'code', label: 'Kode (A–Z)' },
    { value: '-code', label: 'Kode (Z–A)' },
];

const ALL_GROUPS = 'all';

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

type CategoryForm = {
    asset_group_id: string;
    code: string;
    name: string;
    description: string;
};

const EMPTY_FORM: CategoryForm = {
    asset_group_id: '',
    code: '',
    name: '',
    description: '',
};

export default function CategoriesIndex() {
    const { categories, groups, filters } = usePage()
        .props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [sort, setSort] = useState(filters.sort);
    const [group, setGroup] = useState(filters.group);
    const [prevFilters, setPrevFilters] = useState(filters);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState<Category | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

    const form = useForm<CategoryForm>(EMPTY_FORM);

    if (
        filters.search !== prevFilters.search ||
        filters.sort !== prevFilters.sort ||
        filters.group !== prevFilters.group
    ) {
        setPrevFilters(filters);
        setSearch(filters.search);
        setSort(filters.sort);
        setGroup(filters.group);
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

        if (sort) {
            params.sort = sort;
        }

        if (group && group !== ALL_GROUPS) {
            params.group = group;
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['categories', 'groups', 'filters'],
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

    const handleGroupChange = (value: string) => {
        setGroup(value);
        reload({ group: value });
    };

    const clearFilters = () => {
        setSearch('');
        setGroup(ALL_GROUPS);
        reload({ search: '', group: ALL_GROUPS });
        searchInputRef.current?.focus();
    };

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData('asset_group_id', groups[0]?.id ?? '');
        setFormOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        form.setData({
            asset_group_id: category.asset_group_id,
            code: category.code ?? '',
            name: category.name,
            description: category.description ?? '',
        });
        setFormOpen(true);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            only: ['categories', 'groups', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                toast.success(
                    editing
                        ? 'Kategori berhasil diperbarui.'
                        : 'Kategori berhasil ditambahkan.',
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
            only: ['categories', 'groups', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(null);
                toast.success('Kategori berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus kategori.');
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
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.12),transparent_60%)]"
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
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-emerald-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Tags className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Kategori
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelola kategori aset di bawah golongan
                                    klasifikasi Anda.
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
                            Tambah Kategori
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
                                placeholder="Cari nama atau kode kategori..."
                                className="h-11! rounded-xl border-border/70 bg-card/70 pr-16 pl-10 text-sm text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md focus:ring-primary/25"
                            />
                            {search ? (
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-card hover:text-foreground active:scale-95"
                                    onClick={clearFilters}
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

                        <div
                            aria-hidden
                            className="hidden h-8 w-px shrink-0 bg-border/60 lg:block"
                        />

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Select
                                value={group}
                                onValueChange={handleGroupChange}
                            >
                                <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-48">
                                    <FolderTree className="size-4 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Semua Golongan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_GROUPS}>
                                        Semua Golongan
                                    </SelectItem>
                                    {groups.map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={sort}
                                onValueChange={handleSortChange}
                            >
                                <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-44">
                                    <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" />
                                    <SelectValue
                                        placeholder={
                                            activeSort?.label ?? 'Urutkan'
                                        }
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
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Semua Kategori
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                            <Tags className="size-3.5" strokeWidth={1.75} />
                            {categories.total}
                        </span>
                    </div>

                    {categories.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {search.trim() || group !== ALL_GROUPS
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada kategori'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search.trim()
                                        ? `Tidak ditemukan kategori untuk "${search}". Coba kata kunci lain.`
                                        : group !== ALL_GROUPS
                                          ? 'Tidak ada kategori di golongan yang dipilih.'
                                          : 'Buat kategori pertama untuk mulai mengelompokkan aset Anda.'}
                                </p>
                            </div>
                            {search.trim() || group !== ALL_GROUPS ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
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
                                    Tambah Kategori
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {categories.data.map((category, index) => {
                                const accent = ACCENTS[index % ACCENTS.length];

                                return (
                                    <div
                                        key={category.id}
                                        className="glass-card group ease-premium relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                    >
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
                                                    <Tags
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {category.name}
                                                    </h3>
                                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                                        <FolderTree
                                                            className="size-3"
                                                            strokeWidth={1.75}
                                                        />
                                                        {category.asset_group
                                                            ?.name ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-0.5 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                    onClick={() =>
                                                        openEdit(category)
                                                    }
                                                    aria-label={`Edit ${category.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleting(category)
                                                    }
                                                    aria-label={`Hapus ${category.name}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="relative mt-3 flex min-h-[2.5rem] flex-1">
                                            {category.description && (
                                                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
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
                                                    category.created_at,
                                                )}
                                            </p>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-md bg-gradient-to-br px-2 py-1 font-mono text-[11px] font-semibold shadow-sm ring-1',
                                                    accent.badge,
                                                )}
                                            >
                                                <Hash
                                                    className="size-3"
                                                    strokeWidth={2.25}
                                                />
                                                {category.code ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {categories.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Menampilkan {categories.from}–{categories.to}{' '}
                                dari {categories.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!categories.links[0]?.url}
                                    onClick={() =>
                                        goToPage(categories.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {categories.links
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
                                        !categories.links[
                                            categories.links.length - 1
                                        ]?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            categories.links[
                                                categories.links.length - 1
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
                            {editing ? 'Edit Kategori' : 'Tambah Kategori'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui informasi kategori.'
                                : 'Buat kategori aset baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category-group">Golongan</Label>
                            <Select
                                value={form.data.asset_group_id}
                                onValueChange={(value) =>
                                    form.setData('asset_group_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="category-group"
                                    className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                >
                                    <SelectValue placeholder="Pilih golongan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((group) => (
                                        <SelectItem
                                            key={group.id}
                                            value={group.id}
                                        >
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.asset_group_id && (
                                <p className="text-xs text-destructive">
                                    {form.errors.asset_group_id}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category-code">Kode</Label>
                            <Input
                                id="category-code"
                                value={form.data.code}
                                onChange={(event) =>
                                    form.setData('code', event.target.value)
                                }
                                placeholder="Contoh: 01.02"
                                className="font-mono"
                            />
                            {form.errors.code && (
                                <p className="text-xs text-destructive">
                                    {form.errors.code}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category-name">Nama Kategori</Label>
                            <Input
                                id="category-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Contoh: Komputer & Laptop"
                                autoFocus
                                required
                            />
                            {form.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category-description">
                                Deskripsi
                            </Label>
                            <Input
                                id="category-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Keterangan singkat kategori"
                            />
                            {form.errors.description && (
                                <p className="text-xs text-destructive">
                                    {form.errors.description}
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
                        <DialogTitle>Hapus Kategori</DialogTitle>
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

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Kategori',
            href: indexRoute().url,
        },
    ],
};
