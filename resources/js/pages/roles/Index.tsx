import { router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Inbox,
    Pencil,
    Plus,
    Search,
    Shield,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import { index as permissionsIndex } from '@/routes/permissions';
import { destroy, index as indexRoute, store, update } from '@/routes/roles';
import { sync } from '@/routes/roles/permissions';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
    users_count: number;
    created_at: string;
};

type PermissionGroup = {
    group: string;
    permissions: Permission[];
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
    roles: PaginatedData<Role>;
    filters: Filters;
    permissionGroups: PermissionGroup[];
};

const SORT_OPTIONS = [
    { value: '', label: 'Terbaru' },
    { value: 'name', label: 'Nama (A–Z)' },
    { value: '-name', label: 'Nama (Z–A)' },
    { value: 'users', label: 'Pengguna Terbanyak' },
];

const ACCENTS = [
    {
        tile: 'from-sky-500 to-blue-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(56,189,248,0.22),transparent_60%)]',
    },
    {
        tile: 'from-violet-500 to-indigo-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(139,92,246,0.22),transparent_60%)]',
    },
    {
        tile: 'from-teal-500 to-cyan-600',
        glow: 'bg-[radial-gradient(90%_90%_at_100%_0%,rgba(45,212,191,0.22),transparent_60%)]',
    },
];

const ROLE_HINTS: Record<string, string> = {
    'super-admin': 'Akses penuh ke seluruh sistem',
    administrator: 'Mengelola seluruh modul dan pengguna',
    manager: 'Mengelola aset dan inventaris',
    staff: 'Hak akses lihat dasar',
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function PermissionsSheet({
    role,
    groups,
    onClose,
}: {
    role: Role;
    groups: PermissionGroup[];
    onClose: () => void;
}) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(role.permissions.map((permission) => permission.name)),
    );
    const [saving, setSaving] = useState(false);

    const selectedCount = selected.size;
    const totalCount = useMemo(
        () => groups.reduce((sum, group) => sum + group.permissions.length, 0),
        [groups],
    );

    const filteredGroups = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return groups;
        }

        return groups
            .map((group) => ({
                ...group,
                permissions: group.permissions.filter((permission) =>
                    permission.name.toLowerCase().includes(q),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [groups, query]);

    const togglePermission = (name: string) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }

            return next;
        });
    };

    const toggleGroup = (group: PermissionGroup) => {
        const names = group.permissions.map((permission) => permission.name);
        const allSelected = names.every((name) => selected.has(name));

        setSelected((prev) => {
            const next = new Set(prev);

            names.forEach((name) => {
                if (allSelected) {
                    next.delete(name);
                } else {
                    next.add(name);
                }
            });

            return next;
        });
    };

    const handleSave = () => {
        setSaving(true);

        router.put(
            sync(role.id).url,
            { permissions: Array.from(selected) },
            {
                only: ['roles'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSaving(false);
                    onClose();
                    toast.success(
                        `Izin untuk "${role.name}" berhasil diperbarui.`,
                    );
                },
                onError: () => {
                    setSaving(false);
                    toast.error('Gagal memperbarui izin.');
                },
            },
        );
    };

    const changed = !(
        selected.size === role.permissions.length &&
        role.permissions.every((permission) => selected.has(permission.name))
    );

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col sm:max-w-xl"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                        </span>
                        Atur Izin — {role.name}
                    </SheetTitle>
                    <SheetDescription>
                        Centang izin yang diberikan ke peran ini. Perubahan
                        berlaku setelah disimpan.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-3 px-6">
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5">
                        <span className="text-sm font-medium text-foreground">
                            {selectedCount} dari {totalCount} izin dipilih
                        </span>
                        {changed && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                Belum disimpan
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari izin dalam daftar..."
                            className="h-9 rounded-lg pl-9"
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
                    {filteredGroups.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <p className="text-sm font-medium text-foreground">
                                Tidak ada izin ditemukan
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Coba kata kunci lain.
                            </p>
                        </div>
                    )}
                    {filteredGroups.map((group) => {
                        const names = group.permissions.map(
                            (permission) => permission.name,
                        );
                        const allSelected = names.every((name) =>
                            selected.has(name),
                        );
                        const someSelected = names.some((name) =>
                            selected.has(name),
                        );

                        return (
                            <div
                                key={group.group}
                                className="overflow-hidden rounded-xl border border-border/60"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group)}
                                    className="flex w-full items-center gap-3 bg-muted/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/70"
                                >
                                    <Checkbox
                                        checked={
                                            allSelected
                                                ? true
                                                : someSelected
                                                  ? 'indeterminate'
                                                  : false
                                        }
                                        onCheckedChange={() =>
                                            toggleGroup(group)
                                        }
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        aria-label={`Pilih semua di grup ${group.group}`}
                                    />
                                    <span className="flex-1 text-sm font-semibold text-foreground capitalize">
                                        {group.group.replace(/\./g, ' ')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {
                                            names.filter((name) =>
                                                selected.has(name),
                                            ).length
                                        }
                                        /{names.length}
                                    </span>
                                </button>
                                <div className="divide-y divide-border/50 border-t border-border/50">
                                    {group.permissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-muted/40"
                                        >
                                            <Checkbox
                                                checked={selected.has(
                                                    permission.name,
                                                )}
                                                onCheckedChange={() =>
                                                    togglePermission(
                                                        permission.name,
                                                    )
                                                }
                                                aria-label={permission.name}
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate font-mono text-[13px] text-foreground">
                                                    {permission.name}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <SheetFooter className="px-6 pb-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !changed}
                        className="min-w-32"
                    >
                        {saving ? <Spinner className="mr-2 size-4" /> : null}
                        Simpan Perubahan
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default function RolesIndex() {
    const { roles, filters, permissionGroups } = usePage()
        .props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search);
    const [sort, setSort] = useState(filters.sort);
    const [prevFilters, setPrevFilters] = useState(filters);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState<Role | null>(null);
    const [permsRole, setPermsRole] = useState<Role | null>(null);
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
                only: ['roles', 'filters'],
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

    const openEdit = (role: Role) => {
        setEditing(role);
        form.setData('name', role.name);
        setFormOpen(true);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            only: ['roles', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                toast.success(
                    editing
                        ? 'Peran berhasil diperbarui.'
                        : 'Peran berhasil ditambahkan.',
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
            only: ['roles', 'filters'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(null);
                toast.success('Peran berhasil dihapus.');
            },
            onError: (errors) => {
                setDeleting(null);
                toast.error(
                    errors.role ??
                        'Gagal menghapus peran. Pastikan tidak dipakai pengguna.',
                );
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
                                <Shield className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Peran &amp; Izin
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Kelola peran dan hak akses administrator.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto rounded-xl px-4 py-2.5 text-sm"
                                onClick={() =>
                                    router.get(permissionsIndex().url)
                                }
                            >
                                <SlidersHorizontal className="mr-2 size-4" />
                                Kelola Izin
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
                                Tambah Peran
                            </Button>
                        </div>
                    </div>

                    <div className="card-enter mt-7 flex flex-col gap-3 delay-100 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Cari peran..."
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
                            Daftar Peran
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Shield className="size-3.5" strokeWidth={1.75} />
                            {roles.total}
                        </span>
                    </div>

                    {roles.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {search
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada peran'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search
                                        ? `Tidak ditemukan peran untuk "${search}".`
                                        : 'Buat peran pertama untuk mulai mengatur hak akses.'}
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
                                    Tambah Peran
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {roles.data.map((role, index) => {
                                const accent = ACCENTS[index % ACCENTS.length];

                                return (
                                    <div
                                        key={role.id}
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
                                                    <Shield
                                                        className="size-5"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-foreground capitalize">
                                                        {role.name.replace(
                                                            /-/g,
                                                            ' ',
                                                        )}
                                                    </h3>
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {ROLE_HINTS[
                                                            role.name
                                                        ] ?? 'Peran kustom'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 gap-0.5 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                                    onClick={() =>
                                                        openEdit(role)
                                                    }
                                                    aria-label={`Edit ${role.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleting(role)
                                                    }
                                                    disabled={
                                                        role.name ===
                                                        'super-admin'
                                                    }
                                                    aria-label={`Hapus ${role.name}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="relative mt-4 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                                <Users className="size-3.5" />
                                                {role.users_count} pengguna
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                                                <ShieldCheck className="size-3.5" />
                                                {role.permissions.length} izin
                                            </span>
                                        </div>

                                        <div className="relative mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <CalendarClock
                                                    className="size-3.5"
                                                    strokeWidth={2}
                                                />
                                                Dibuat{' '}
                                                {formatDate(role.created_at)}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg text-xs"
                                                onClick={() =>
                                                    setPermsRole(role)
                                                }
                                            >
                                                <SlidersHorizontal
                                                    className="mr-1.5 size-3.5"
                                                    strokeWidth={2}
                                                />
                                                Atur Izin
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {roles.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {roles.from}–{roles.to} dari{' '}
                                {roles.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!roles.links[0]?.url}
                                    onClick={() =>
                                        goToPage(roles.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {roles.links.slice(1, -1).map((link, i) => (
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
                                        !roles.links[roles.links.length - 1]
                                            ?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            roles.links[roles.links.length - 1]
                                                ?.url,
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
                            {editing ? 'Edit Peran' : 'Tambah Peran'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui nama peran.'
                                : 'Buat peran baru, lalu atur izinnya setelah dibuat.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role-name">Nama Peran</Label>
                            <Input
                                id="role-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData(
                                        'name',
                                        event.target.value.toLowerCase(),
                                    )
                                }
                                placeholder="contoh: supervisor-gudang"
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
                        <DialogTitle>Hapus Peran</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus peran &ldquo;
                            {deleting?.name}
                            &rdquo;? Pengguna dengan peran ini akan kehilangan
                            izinnya. Tindakan ini tidak dapat dibatalkan.
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

            {permsRole && (
                <PermissionsSheet
                    key={permsRole.id}
                    role={permsRole}
                    groups={permissionGroups}
                    onClose={() => setPermsRole(null)}
                />
            )}
        </div>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Peran & Izin',
            href: indexRoute().url,
        },
    ],
};
