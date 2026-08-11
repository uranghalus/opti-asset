import { router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    CalendarClock,
    ChevronRight,
    Hash,
    Inbox,
    Layers,
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
import { Checkbox } from '@/components/ui/checkbox';
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
    destroyBulk,
    index as indexRoute,
    store,
    update,
} from '@/routes/categories';

type ClassificationOption = {
    id: string;
    code: string | null;
    name: string;
    asset_group_id?: string;
    asset_category_id?: string;
    asset_cluster_id?: string;
};

type ClassificationLevel = 'GROUP' | 'CATEGORY' | 'CLUSTER' | 'SUBCLUSTER';

type ChainNode = {
    level: ClassificationLevel;
    id: string;
    code: string | null;
    name: string;
};

type Category = {
    id: string;
    name: string;
    code: string | null;
    classification_type: ClassificationLevel | null;
    classification_id: string | null;
    chain: ChainNode[];
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
    categories: PaginatedData<Category>;
    groups: ClassificationOption[];
    optionCategories: ClassificationOption[];
    optionClusters: ClassificationOption[];
    optionSubClusters: ClassificationOption[];
    filters: Filters;
};

const SORT_OPTIONS = [
    { value: '', label: 'Terbaru' },
    { value: 'name', label: 'Nama (A–Z)' },
    { value: '-name', label: 'Nama (Z–A)' },
    { value: 'code', label: 'Kode (A–Z)' },
    { value: '-code', label: 'Kode (Z–A)' },
];

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

const LEVEL_LABELS: Record<ClassificationLevel, string> = {
    GROUP: 'Golongan',
    CATEGORY: 'Kategori',
    CLUSTER: 'Cluster',
    SUBCLUSTER: 'Sub Cluster',
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

type CategoryForm = {
    name: string;
    classification_type: ClassificationLevel | '';
    classification_id: string;
};

const EMPTY_FORM: CategoryForm = {
    name: '',
    classification_type: '',
    classification_id: '',
};

export default function CategoriesIndex() {
    const {
        categories,
        groups,
        optionCategories,
        optionClusters,
        optionSubClusters,
        filters,
    } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');
    const [sort, setSort] = useState(filters.sort ?? '');
    const [prevFilters, setPrevFilters] = useState(filters);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState<Category | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [selGroup, setSelGroup] = useState('');
    const [selCategory, setSelCategory] = useState('');
    const [selCluster, setSelCluster] = useState('');
    const [selSubCluster, setSelSubCluster] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

    const pageIds = categories.data.map((category) => category.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.has(id));

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected(allSelected ? new Set() : new Set(pageIds));
    };

    const form = useForm<CategoryForm>(EMPTY_FORM);

    const cascadeCategories = (optionCategories ?? []).filter(
        (item) => selGroup && item.asset_group_id === selGroup,
    );
    const cascadeClusters = (optionClusters ?? []).filter(
        (item) => selCategory && item.asset_category_id === selCategory,
    );
    const cascadeSubClusters = (optionSubClusters ?? []).filter(
        (item) => selCluster && item.asset_cluster_id === selCluster,
    );

    const selectedLevel: ClassificationLevel | null = selSubCluster
        ? 'SUBCLUSTER'
        : selCluster
          ? 'CLUSTER'
          : selCategory
            ? 'CATEGORY'
            : selGroup
              ? 'GROUP'
              : null;

    const selectedCode = [
        groups.find((item) => item.id === selGroup)?.code,
        cascadeCategories.find((item) => item.id === selCategory)?.code,
        cascadeClusters.find((item) => item.id === selCluster)?.code,
        cascadeSubClusters.find((item) => item.id === selSubCluster)?.code,
    ]
        .filter((code): code is string => Boolean(code))
        .join('.');

    const selectedNode =
        cascadeSubClusters.find((item) => item.id === selSubCluster) ??
        cascadeClusters.find((item) => item.id === selCluster) ??
        cascadeCategories.find((item) => item.id === selCategory) ??
        groups.find((item) => item.id === selGroup) ??
        null;

    const applySelection = (
        groupId: string,
        category?: ClassificationOption,
        cluster?: ClassificationOption,
        subCluster?: ClassificationOption,
    ) => {
        const node = subCluster ?? cluster ?? category;
        const selectedGroup = groups.find((item) => item.id === groupId);

        form.setData('name', node?.name ?? selectedGroup?.name ?? '');
    };

    const handleSelectGroup = (value: string) => {
        setSelGroup(value);
        setSelCategory('');
        setSelCluster('');
        setSelSubCluster('');
        applySelection(value);
    };

    const handleSelectCategory = (value: string) => {
        setSelCategory(value);
        setSelCluster('');
        setSelSubCluster('');
        applySelection(
            selGroup,
            optionCategories.find((item) => item.id === value),
        );
    };

    const handleSelectCluster = (value: string) => {
        setSelCluster(value);
        setSelSubCluster('');
        applySelection(
            selGroup,
            optionCategories.find((item) => item.id === selCategory),
            optionClusters.find((item) => item.id === value),
        );
    };

    const handleSelectSubCluster = (value: string) => {
        setSelSubCluster(value);
        applySelection(
            selGroup,
            optionCategories.find((item) => item.id === selCategory),
            optionClusters.find((item) => item.id === selCluster),
            optionSubClusters.find((item) => item.id === value),
        );
    };

    if (
        filters.search !== prevFilters.search ||
        filters.sort !== prevFilters.sort
    ) {
        setPrevFilters(filters);
        setSearch(filters.search ?? '');
        setSort(filters.sort ?? '');
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
        const currentSearch =
            overrides.search !== undefined ? overrides.search : search;
        const currentSort =
            overrides.sort !== undefined ? overrides.sort : sort;

        const params: Record<string, string> = {};

        if (currentSearch.trim()) {
            params.search = currentSearch.trim();
        }

        if (currentSort) {
            params.sort = currentSort;
        }

        router.get(indexRoute().url, params, {
            preserveState: true,
            replace: true,
            only: [
                'categories',
                'groups',
                'filters',
                'optionCategories',
                'optionClusters',
                'optionSubClusters',
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

    const handleSortChange = (value: string) => {
        setSort(value);
        reload({ sort: value });
    };

    const clearFilters = () => {
        setSearch('');
        setSort('');
        reload({ search: '', sort: '' });
        searchInputRef.current?.focus();
    };

    const openCreate = () => {
        setEditing(null);
        form.reset();
        setSelGroup('');
        setSelCategory('');
        setSelCluster('');
        setSelSubCluster('');
        setFormOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        form.reset();
        form.setData({
            name: category.name,
            classification_type: category.classification_type ?? '',
            classification_id: category.classification_id ?? '',
        });
        setSelGroup(category.chain[0]?.id ?? '');
        setSelCategory(category.chain[1]?.id ?? '');
        setSelCluster(category.chain[2]?.id ?? '');
        setSelSubCluster(category.chain[3]?.id ?? '');
        setFormOpen(true);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedLevel || !selectedNode) {
            toast.error('Pilih golongan dari klasifikasi terlebih dahulu.');

            return;
        }

        form.setData('classification_type', selectedLevel);
        form.setData('classification_id', selectedNode.id);

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

    const handleBulkDelete = () => {
        if (selected.size === 0) {
            return;
        }

        setBulkDeleting(true);

        router.delete(destroyBulk().url, {
            data: { ids: Array.from(selected) },
            only: ['categories', 'groups', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setBulkDeleting(false);
                setBulkDeleteOpen(false);
                setSelected(new Set());
                toast.success('Kategori terpilih berhasil dihapus.');
            },
            onError: () => {
                setBulkDeleting(false);
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
                                    Kategori Item
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelola kategori untuk mengelompokkan item
                                    berdasarkan klasifikasi aset Anda.
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

                        <Select value={sort} onValueChange={handleSortChange}>
                            <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-44">
                                <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" />
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

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <div className="flex items-center gap-2.5">
                            <Checkbox
                                id="select-all-categories"
                                aria-label="Pilih semua kategori"
                                checked={allSelected}
                                onCheckedChange={toggleSelectAll}
                                disabled={categories.data.length === 0}
                            />
                            <h2 className="text-sm font-semibold tracking-wide text-foreground">
                                Semua Kategori
                            </h2>
                        </div>
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
                                    {search.trim()
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada kategori'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search.trim()
                                        ? `Tidak ditemukan kategori untuk "${search}". Coba kata kunci lain.`
                                        : 'Buat kategori pertama untuk mulai mengelompokkan item Anda.'}
                                </p>
                            </div>
                            {search.trim() ? (
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
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    aria-label={`Pilih ${category.name}`}
                                                    checked={selected.has(
                                                        category.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelect(
                                                            category.id,
                                                        )
                                                    }
                                                    className="mt-1 shrink-0"
                                                />
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
                                                            {category.chain
                                                                .length > 0 ? (
                                                                category.chain.map(
                                                                    (
                                                                        node,
                                                                        i,
                                                                    ) => (
                                                                        <span
                                                                            key={`${node.level}-${node.id}`}
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            {i >
                                                                                0 && (
                                                                                <ChevronRight className="size-3 text-muted-foreground/60" />
                                                                            )}
                                                                            {
                                                                                node.name
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <span>—</span>
                                                            )}
                                                        </p>
                                                    </div>
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

                                        <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br px-2 py-1 text-xs font-semibold shadow-sm ring-1',
                                                    accent.badge,
                                                )}
                                            >
                                                <Layers
                                                    className="size-3.5"
                                                    strokeWidth={2}
                                                />
                                                {category.classification_type
                                                    ? LEVEL_LABELS[
                                                          category
                                                              .classification_type
                                                      ]
                                                    : '—'}
                                            </span>
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
                                        </div>

                                        <div className="relative mt-3 flex items-center justify-between gap-3">
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

                    {selected.size > 0 && (
                        <div className="card-enter sticky bottom-4 z-20 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-background/85 px-4 py-3 shadow-xl backdrop-blur-xl delay-150">
                            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
                                    {selected.size}
                                </span>
                                <span className="truncate">
                                    kategori dipilih
                                </span>
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    onClick={() => setSelected(new Set())}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-9 gap-2 rounded-xl"
                                    onClick={() => setBulkDeleteOpen(true)}
                                >
                                    <Trash2 className="size-4" />
                                    Hapus Terpilih
                                </Button>
                            </div>
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
                                ? 'Perbarui informasi kategori item.'
                                : 'Buat kategori item baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/15 text-primary">
                                <Layers className="size-4" strokeWidth={1.75} />
                            </span>
                            <div>
                                <p className="text-xs font-semibold text-foreground">
                                    Pilih dari Klasifikasi Aset
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Kode & nama mengikuti level terdalam yang
                                    dipilih.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-1">
                                    Golongan
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selGroup}
                                    onValueChange={handleSelectGroup}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm">
                                        <SelectValue placeholder="Pilih Golongan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code
                                                    ? `${item.code} — `
                                                    : ''}
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.classification_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.classification_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label>Kategori</Label>
                                <Select
                                    value={selCategory}
                                    onValueChange={handleSelectCategory}
                                    disabled={!selGroup}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm">
                                        <SelectValue
                                            placeholder={
                                                selGroup
                                                    ? 'Pilih Kategori'
                                                    : 'Pilih golongan dulu'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cascadeCategories.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code
                                                    ? `${item.code} — `
                                                    : ''}
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Cluster</Label>
                                <Select
                                    value={selCluster}
                                    onValueChange={handleSelectCluster}
                                    disabled={!selCategory}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm">
                                        <SelectValue
                                            placeholder={
                                                selCategory
                                                    ? 'Pilih Cluster'
                                                    : 'Pilih kategori dulu'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cascadeClusters.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code
                                                    ? `${item.code} — `
                                                    : ''}
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Sub Cluster</Label>
                                <Select
                                    value={selSubCluster}
                                    onValueChange={handleSelectSubCluster}
                                    disabled={!selCluster}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm">
                                        <SelectValue
                                            placeholder={
                                                selCluster
                                                    ? 'Pilih Sub Cluster'
                                                    : 'Pilih cluster dulu'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cascadeSubClusters.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code
                                                    ? `${item.code} — `
                                                    : ''}
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedLevel && (
                            <div className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/15 text-primary">
                                    <Hash
                                        className="size-3.5"
                                        strokeWidth={2}
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Kode Kategori Otomatis
                                    </p>
                                    <p className="truncate font-mono text-sm font-bold text-primary tabular-nums">
                                        {selectedCode || '—'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="category-name">Nama Kategori</Label>
                            <Input
                                id="category-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder={
                                    editing
                                        ? 'Contoh: Komputer & Laptop'
                                        : 'Terisi otomatis dari klasifikasi'
                                }
                                autoFocus={Boolean(editing)}
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
            <Dialog
                open={bulkDeleteOpen}
                onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus {selected.size} kategori
                            terpilih? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBulkDeleteOpen(false)}
                            disabled={bulkDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                        >
                            {bulkDeleting ? (
                                <Spinner className="mr-2 size-4" />
                            ) : (
                                <Trash2 className="mr-2 size-4" />
                            )}
                            Hapus {selected.size} Kategori
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
