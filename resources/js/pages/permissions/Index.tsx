import { router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronsUpDown,
    Inbox,
    KeyRound,
    Pencil,
    Plus,
    Search,
    Shield,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import {
    destroy,
    index as indexRoute,
    store,
    update,
} from '@/routes/permissions';
import { index as rolesIndex } from '@/routes/roles';

type Permission = {
    id: number;
    name: string;
    created_at: string;
};

type GroupOption = {
    name: string;
    count: number;
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
    group: string;
    sort: string;
};

type PageProps = {
    permissions: PaginatedData<Permission>;
    filters: Filters;
    groups: GroupOption[];
};

const ACTION_STYLES: Record<string, string> = {
    view: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    read: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    create: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    add: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    edit: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    update: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    delete: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    adjust: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    export: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    import: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

const DEFAULT_ACTION_STYLE = 'bg-muted/60 text-muted-foreground';

const ACTION_OPTIONS = [
    { value: 'view' },
    { value: 'create' },
    { value: 'edit' },
    { value: 'update' },
    { value: 'delete' },
    { value: 'adjust' },
    { value: 'export' },
    { value: 'import' },
];

const PAGE_SIZES = [10, 25, 50];

function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim().toLowerCase();

    if (!q) {
        return <>{text}</>;
    }

    const lower = text.toLowerCase();
    const parts: { value: string; match: boolean }[] = [];
    let index = 0;

    while (index < text.length) {
        const matchIndex = lower.indexOf(q, index);

        if (matchIndex === -1) {
            parts.push({ value: text.slice(index), match: false });
            break;
        }

        if (matchIndex > index) {
            parts.push({ value: text.slice(index, matchIndex), match: false });
        }

        parts.push({
            value: text.slice(matchIndex, matchIndex + q.length),
            match: true,
        });
        index = matchIndex + q.length;
    }

    return (
        <>
            {parts.map((part, i) =>
                part.match ? (
                    <span
                        key={i}
                        className="rounded bg-primary/20 px-0.5 text-primary"
                    >
                        {part.value}
                    </span>
                ) : (
                    <span key={i}>{part.value}</span>
                ),
            )}
        </>
    );
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function PermissionsIndex() {
    const { permissions, filters, groups } = usePage()
        .props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [group, setGroup] = useState(filters.group);
    const [sort, setSort] = useState(filters.sort);
    const [perPage, setPerPage] = useState(permissions.per_page);
    const [prevFilters, setPrevFilters] = useState(filters);
    const [prevPerPage, setPrevPerPage] = useState(permissions.per_page);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Permission | null>(null);
    const [deleting, setDeleting] = useState<Permission | null>(null);
    const [customOn, setCustomOn] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    const createForm = useForm<{
        resource: string;
        actions: string[];
        customAction: string;
    }>({
        resource: '',
        actions: [],
        customAction: '',
    });

    const editForm = useForm<{ name: string }>({ name: '' });

    const toggleAction = (value: string) => {
        createForm.setData(
            'actions',
            createForm.data.actions.includes(value)
                ? createForm.data.actions.filter((action) => action !== value)
                : [...createForm.data.actions, value],
        );
    };

    const customActions =
        customOn && createForm.data.customAction.trim()
            ? createForm.data.customAction
                  .split(/[,\s]+/)
                  .map((action) => action.trim().toLowerCase())
                  .filter((action) => action !== '')
            : [];

    const previewActions = [
        ...createForm.data.actions,
        ...customActions,
    ].filter((action, index, all) => all.indexOf(action) === index);

    if (
        filters.search !== prevFilters.search ||
        filters.group !== prevFilters.group ||
        filters.sort !== prevFilters.sort
    ) {
        setPrevFilters(filters);
        setSearch(filters.search);
        setGroup(filters.group);
        setSort(filters.sort);
    }

    if (permissions.per_page !== prevPerPage) {
        setPrevPerPage(permissions.per_page);
        setPerPage(permissions.per_page);
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

        if (group) {
            params.group = group;
        }

        if (sort) {
            params.sort = sort;
        }

        params.per_page = String(perPage);

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['permissions', 'filters'],
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

    const handleGroupChange = (value: string) => {
        setGroup(value);
        reload({ group: value });
    };

    const handleSortChange = (value: string) => {
        setSort(value);
        reload({ sort: value });
    };

    const toggleSort = () => {
        handleSortChange(sort === 'name' ? '-name' : 'name');
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(Number(value));
        reload({ per_page: value });
    };

    const openCreate = () => {
        setEditing(null);
        createForm.reset();
        setCustomOn(false);
        setFormOpen(true);
    };

    const openEdit = (permission: Permission) => {
        setEditing(permission);
        editForm.setData('name', permission.name);
        setFormOpen(true);
    };

    const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const actions = previewActions;

        if (actions.length === 0) {
            toast.error('Pilih minimal satu tindakan.');

            return;
        }

        createForm.transform((data) => ({
            resource: data.resource,
            actions,
        }));

        createForm.post(store().url, {
            only: ['permissions', 'filters', 'groups'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                createForm.reset();
                setCustomOn(false);
                toast.success(`${actions.length} izin berhasil ditambahkan.`);
            },
            onError: () => {
                toast.error('Periksa kembali data yang diisi.');
            },
        });
    };

    const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editing) {
            return;
        }

        editForm.patch(update(editing.id).url, {
            only: ['permissions', 'filters', 'groups'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                toast.success('Izin berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Periksa kembali data yang diisi.');
            },
        });
    };

    const handleDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(destroy(deleting.id).url, {
            only: ['permissions', 'filters', 'groups'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(null);
                toast.success('Izin berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus izin.');
            },
        });
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const totalGroups = groups.length;

    const sortIcon =
        sort === '-name' ? (
            <ArrowDown className="size-3.5" />
        ) : sort === 'name' ? (
            <ArrowUp className="size-3.5" />
        ) : (
            <ChevronsUpDown className="size-3.5 opacity-60" />
        );

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
                            <div className="glass-card flex size-12 items-center justify-center rounded-2xl text-primary shadow-md">
                                <KeyRound
                                    className="size-6"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Izin
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Definisikan hak akses untuk setiap modul.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto rounded-xl px-4 py-2.5 text-sm"
                                onClick={() => router.get(rolesIndex().url)}
                            >
                                <Shield className="mr-2 size-4" />
                                Kelola Peran
                            </Button>
                            <Button
                                size="sm"
                                onClick={openCreate}
                                className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                            >
                                <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
                                    <Plus
                                        className="size-3.5"
                                        strokeWidth={2.25}
                                    />
                                </span>
                                Tambah Izin
                            </Button>
                        </div>
                    </div>

                    <div className="glass-panel card-enter mt-7 flex flex-col gap-3 p-3 delay-100 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Cari izin..."
                                className="h-11 rounded-xl border-border/60 bg-background/60 pr-10 pl-10 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20"
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
                        <div className="flex flex-wrap gap-3">
                            <Select
                                value={group}
                                onValueChange={handleGroupChange}
                            >
                                <SelectTrigger className="h-11 min-w-44 rounded-xl border-border/60 bg-background/60 text-sm shadow-sm">
                                    <SelectValue
                                        placeholder={
                                            group
                                                ? group.replace(/\./g, ' ')
                                                : 'Semua Grup'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        Semua Grup ({totalGroups})
                                    </SelectItem>
                                    {groups.map((groupItem) => (
                                        <SelectItem
                                            key={groupItem.name}
                                            value={groupItem.name}
                                        >
                                            {groupItem.name.replace(/\./g, ' ')}{' '}
                                            ({groupItem.count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={String(perPage)}
                                onValueChange={handlePerPageChange}
                            >
                                <SelectTrigger className="h-11 w-28 rounded-xl border-border/60 bg-background/60 text-sm shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                        >
                                            {size} / halaman
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="glass-panel card-enter mt-4 flex flex-col overflow-hidden delay-150">
                        <div className="glass-header relative overflow-hidden px-4 py-2.5">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(0,128,255,0.2),transparent_60%)] dark:bg-[radial-gradient(60%_120%_at_0%_0%,rgba(90,169,236,0.25),transparent_60%)]"
                            />
                            <div className="relative flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                                    Daftar Izin
                                </h2>
                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    {permissions.total} izin · {totalGroups}{' '}
                                    grup
                                </span>
                            </div>
                        </div>

                        <div className="max-h-[62dvh] flex-1 overflow-auto">
                            <Table className="[&_tr]:border-border/50">
                                <TableHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                            #
                                        </TableHead>
                                        <TableHead>
                                            <button
                                                type="button"
                                                onClick={toggleSort}
                                                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                                            >
                                                Nama Izin
                                                {sortIcon}
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:table-cell">
                                            Tindakan
                                        </TableHead>
                                        <TableHead className="hidden text-[11px] font-semibold tracking-wide text-muted-foreground uppercase md:table-cell">
                                            Dibuat
                                        </TableHead>
                                        <TableHead className="w-24 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.data.map(
                                        (permission, index) => {
                                            const dotIndex =
                                                permission.name.lastIndexOf(
                                                    '.',
                                                );
                                            const groupPart =
                                                dotIndex === -1
                                                    ? ''
                                                    : permission.name.slice(
                                                          0,
                                                          dotIndex + 1,
                                                      );
                                            const actionPart =
                                                dotIndex === -1
                                                    ? permission.name
                                                    : permission.name.slice(
                                                          dotIndex + 1,
                                                      );
                                            const actionStyle =
                                                ACTION_STYLES[actionPart] ??
                                                DEFAULT_ACTION_STYLE;

                                            return (
                                                <TableRow
                                                    key={permission.id}
                                                    className="group transition-colors hover:bg-muted/50"
                                                >
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                        {permissions.from +
                                                            index}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                                                                <KeyRound
                                                                    className="size-4"
                                                                    strokeWidth={
                                                                        1.75
                                                                    }
                                                                />
                                                            </div>
                                                            <span className="font-mono text-[13px] text-foreground">
                                                                <span className="text-muted-foreground/70">
                                                                    <Highlight
                                                                        text={
                                                                            groupPart
                                                                        }
                                                                        query={
                                                                            search
                                                                        }
                                                                    />
                                                                </span>
                                                                <Highlight
                                                                    text={
                                                                        actionPart
                                                                    }
                                                                    query={
                                                                        search
                                                                    }
                                                                />
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
                                                                actionStyle,
                                                            )}
                                                        >
                                                            {actionPart}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                                                        {formatDate(
                                                            permission.created_at,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        permission,
                                                                    )
                                                                }
                                                                aria-label={`Edit ${permission.name}`}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    setDeleting(
                                                                        permission,
                                                                    )
                                                                }
                                                                aria-label={`Hapus ${permission.name}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )}

                                    {permissions.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="py-20"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                    <div className="glass-card flex size-14 items-center justify-center rounded-2xl text-primary shadow-md">
                                                        <Inbox
                                                            className="size-6"
                                                            strokeWidth={1.25}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {search || group
                                                                ? 'Tidak ada hasil filter'
                                                                : 'Belum ada izin'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {search || group
                                                                ? 'Coba ubah kata kunci atau filter grup.'
                                                                : 'Buat izin pertama untuk mulai mengatur akses.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {permissions.last_page > 1 && (
                            <div className="glass-header flex flex-col items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    Menampilkan {permissions.from}–
                                    {permissions.to} dari {permissions.total}{' '}
                                    izin
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg"
                                        disabled={!permissions.links[0]?.url}
                                        onClick={() =>
                                            goToPage(permissions.links[0]?.url)
                                        }
                                    >
                                        Sebelumnya
                                    </Button>
                                    {permissions.links
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
                                                className="size-8 rounded-lg"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    goToPage(link.url)
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg"
                                        disabled={
                                            !permissions.links[
                                                permissions.links.length - 1
                                            ]?.url
                                        }
                                        onClick={() =>
                                            goToPage(
                                                permissions.links[
                                                    permissions.links.length - 1
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
            </div>

            <Dialog
                open={formOpen && !editing}
                onOpenChange={(open) => !open && setFormOpen(false)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Izin</DialogTitle>
                        <DialogDescription>
                            Gabungkan nama grup dengan tindakan. Setiap tindakan
                            dicentang akan dibuat sebagai izin terpisah.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="permission-resource">
                                Nama Grup / Resource
                            </Label>
                            <Input
                                id="permission-resource"
                                value={createForm.data.resource}
                                onChange={(event) =>
                                    createForm.setData(
                                        'resource',
                                        event.target.value.toLowerCase(),
                                    )
                                }
                                placeholder="contoh: asset.location"
                                autoFocus
                                required
                            />
                            {createForm.errors.resource && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.resource}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Tindakan</Label>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                {ACTION_OPTIONS.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2 transition-colors hover:bg-muted/70"
                                    >
                                        <Checkbox
                                            checked={createForm.data.actions.includes(
                                                option.value,
                                            )}
                                            onCheckedChange={() =>
                                                toggleAction(option.value)
                                            }
                                            aria-label={option.value}
                                        />
                                        <span
                                            className={cn(
                                                'font-mono text-xs font-medium',
                                                ACTION_STYLES[option.value] ??
                                                    'text-foreground',
                                            )}
                                        >
                                            {option.value}
                                        </span>
                                    </label>
                                ))}
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2 transition-colors hover:bg-muted/70">
                                    <Checkbox
                                        checked={customOn}
                                        onCheckedChange={(checked) =>
                                            setCustomOn(checked === true)
                                        }
                                        aria-label="Lainnya"
                                    />
                                    <span className="text-xs font-medium text-foreground">
                                        Lainnya...
                                    </span>
                                </label>
                            </div>
                            {createForm.errors.actions && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.actions}
                                </p>
                            )}
                        </div>

                        {customOn && (
                            <div className="grid gap-2">
                                <Label htmlFor="permission-custom">
                                    Tindakan Kustom
                                </Label>
                                <Input
                                    id="permission-custom"
                                    value={createForm.data.customAction}
                                    onChange={(event) =>
                                        createForm.setData(
                                            'customAction',
                                            event.target.value.toLowerCase(),
                                        )
                                    }
                                    placeholder="pisahkan dengan koma, contoh: export, import"
                                />
                            </div>
                        )}

                        {previewActions.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Akan Dibuat</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {previewActions.map((action) => (
                                        <span
                                            key={action}
                                            className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/60 px-2 py-1 font-mono text-[11px] text-foreground"
                                        >
                                            <span className="text-muted-foreground/70">
                                                {createForm.data.resource}.
                                            </span>
                                            <span
                                                className={cn(
                                                    'rounded px-1 py-px text-[10px] font-semibold',
                                                    ACTION_STYLES[action] ??
                                                        DEFAULT_ACTION_STYLE,
                                                )}
                                            >
                                                {action}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={createForm.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    createForm.processing ||
                                    previewActions.length === 0
                                }
                                className="min-w-32"
                            >
                                {createForm.processing ? (
                                    <Spinner className="mr-2 size-4" />
                                ) : null}
                                {previewActions.length > 1
                                    ? `Tambah ${previewActions.length} Izin`
                                    : 'Tambah Izin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={formOpen && editing !== null}
                onOpenChange={(open) => !open && setFormOpen(false)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Izin</DialogTitle>
                        <DialogDescription>
                            Perbarui nama izin. Format: resource.tindakan.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="permission-name">Nama Izin</Label>
                            <Input
                                id="permission-name"
                                value={editForm.data.name}
                                onChange={(event) =>
                                    editForm.setData(
                                        'name',
                                        event.target.value.toLowerCase(),
                                    )
                                }
                                placeholder="contoh: asset.location.view"
                                autoFocus
                                required
                            />
                            {editForm.errors.name && (
                                <p className="text-xs text-destructive">
                                    {editForm.errors.name}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={editForm.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                className="min-w-24"
                            >
                                {editForm.processing ? (
                                    <Spinner className="mr-2 size-4" />
                                ) : null}
                                Simpan
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
                        <DialogTitle>Hapus Izin</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus izin &ldquo;
                            {deleting?.name}
                            &rdquo;? Peran yang menggunakannya akan kehilangan
                            hak ini. Tindakan ini tidak dapat dibatalkan.
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

PermissionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Izin',
            href: indexRoute().url,
        },
    ],
};
