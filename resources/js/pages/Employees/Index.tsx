import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarClock,
    Inbox,
    Mail,
    RefreshCw,
    Search,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { index as indexRoute, show, sync } from '@/routes/employees';
import { update as updateRoles } from '@/routes/employees/roles';

type RoleOption = {
    id: number;
    name: string;
};

type Employee = {
    id_employee: string;
    nik_employee: string | null;
    nama_employee: string;
    email: string | null;
    number: string | null;
    photo_url: string | null;
    id_department: string | null;
    department: {
        id_department: string;
        kode_department: string;
        nama_department: string | null;
    } | null;
    roles: RoleOption[];
    created_at: string;
};

type DepartmentOption = {
    id_department: string;
    kode_department: string;
    nama_department: string | null;
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
    employees: PaginatedData<Employee>;
    departments: DepartmentOption[];
    roles: RoleOption[];
    filters: { search: string | null; department: string | null };
};

const ROLE_ACCENTS = [
    'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
    'bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300',
];

function roleAccent(index: number): string {
    return ROLE_ACCENTS[index % ROLE_ACCENTS.length];
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function EmployeesIndex() {
    const {
        employees,
        departments,
        roles: allRoles,
        filters,
    } = usePage().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search ?? '');
    const [department, setDepartment] = useState(filters.department ?? 'all');
    const [prevFilters, setPrevFilters] = useState(filters);
    const [syncOpen, setSyncOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = useIsProcessing();

    const {
        data: roleForm,
        setData: setRoleForm,
        post: assignPost,
        processing: assignProcessing,
        reset: resetRoleForm,
        errors: assignErrors,
    } = useForm<{ roles: string[] }>({ roles: [] });

    if (
        filters.search !== prevFilters.search ||
        filters.department !== prevFilters.department
    ) {
        setPrevFilters(filters);
        setSearch(filters.search ?? '');
        setDepartment(filters.department ?? 'all');
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

    const reload = (overrides: Record<string, string>) => {
        const params: Record<string, string> = {};

        if (search.trim()) {
            params.search = search.trim();
        }

        if (department && department !== 'all') {
            params.department = department;
        }

        router.get(
            indexRoute().url,
            { ...params, ...overrides },
            {
                preserveState: true,
                replace: true,
                only: ['employees', 'filters'],
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

    const handleDepartmentChange = (value: string) => {
        setDepartment(value);
        reload({ department: value });
    };

    const clearFilters = () => {
        setSearch('');
        setDepartment('all');
        reload({ search: '', department: '' });
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

    const openAssign = (employee: Employee) => {
        setAssignTarget(employee);
        setRoleForm(
            'roles',
            employee.roles.map((role) => role.name),
        );
    };

    const closeAssign = () => {
        setAssignTarget(null);
        resetRoleForm();
    };

    const handleAssign = () => {
        if (!assignTarget) {
            return;
        }

        assignPost(updateRoles(assignTarget.id_employee).url, {
            preserveScroll: true,
            onSuccess: () => closeAssign(),
        });
    };

    const toggleRole = (roleName: string, checked: boolean) => {
        setRoleForm(
            'roles',
            checked
                ? [...roleForm.roles, roleName]
                : roleForm.roles.filter((name) => name !== roleName),
        );
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

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
                                <Users className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Karyawan
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Seluruh karyawan organisasi Anda,
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

                    <div className="glass-panel card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100 sm:flex-row sm:items-center">
                        <div className="group relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                ref={searchInputRef}
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Cari NIK, nama, atau email..."
                                className="h-11! rounded-xl border-border/70 bg-card/70 pr-16 pl-10 text-sm text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md focus:ring-primary/25"
                            />
                            {search ? (
                                <button
                                    type="button"
                                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-card hover:text-foreground active:scale-95"
                                    onClick={() => {
                                        setSearch('');
                                        reload({ search: '' });
                                    }}
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

                        <Select
                            value={department}
                            onValueChange={handleDepartmentChange}
                        >
                            <SelectTrigger className="h-11! w-full justify-start rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl sm:w-52">
                                <SelectValue placeholder="Semua Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Department
                                </SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem
                                        key={dept.id_department}
                                        value={dept.id_department}
                                    >
                                        {dept.nama_department ??
                                            dept.kode_department}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                        <h2 className="text-sm font-semibold tracking-wide text-foreground">
                            Semua Karyawan
                        </h2>
                        <div className="flex items-center gap-3">
                            {(filters.search ||
                                (filters.department &&
                                    filters.department !== 'all')) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 size-3.5" />
                                    Hapus filter
                                </Button>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                                <Users
                                    className="size-3.5"
                                    strokeWidth={1.75}
                                />
                                {employees.total}
                            </span>
                        </div>
                    </div>

                    {employees.data.length === 0 ? (
                        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                            <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                                <Inbox className="size-7" strokeWidth={1.25} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    {search.trim() ||
                                    (department && department !== 'all')
                                        ? 'Tidak ada hasil pencarian'
                                        : 'Belum ada karyawan'}
                                </p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    {search.trim() ||
                                    (department && department !== 'all')
                                        ? 'Tidak ditemukan karyawan dengan filter tersebut. Coba kata kunci lain.'
                                        : 'Sinkronkan data dari Portal Optigate untuk memuat karyawan organisasi Anda.'}
                                </p>
                            </div>
                            {search.trim() ||
                            (department && department !== 'all') ? (
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
                            {employees.data.map((employee) => (
                                <div
                                    key={employee.id_employee}
                                    className="glass-card ease-premium group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
                                >
                                    <Link
                                        href={show(employee).url}
                                        className="flex flex-1 flex-col"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3.5">
                                                {employee.photo_url ? (
                                                    <img
                                                        src={employee.photo_url}
                                                        alt={
                                                            employee.nama_employee
                                                        }
                                                        className="size-12 shrink-0 rounded-xl object-cover shadow-md ring-1 ring-primary/10"
                                                    />
                                                ) : (
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-emerald-500/15 font-semibold text-sky-600 shadow-md ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 dark:text-sky-300">
                                                        <span className="text-sm">
                                                            {employee.nama_employee
                                                                .split(' ')
                                                                .slice(0, 2)
                                                                .map(
                                                                    (w) => w[0],
                                                                )
                                                                .join('')
                                                                .toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {employee.nama_employee}
                                                    </h3>
                                                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                                        {employee.nik_employee ??
                                                            '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                                        </div>

                                        <div className="relative mt-4 flex flex-1 flex-col gap-2 border-t border-border/60 pt-3.5 text-xs">
                                            {employee.department && (
                                                <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                    <Building2
                                                        className="size-3.5"
                                                        strokeWidth={2}
                                                    />
                                                    {employee.department
                                                        .nama_department ??
                                                        employee.department
                                                            .kode_department}
                                                </p>
                                            )}
                                            {employee.email && (
                                                <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                                                    <Mail
                                                        className="size-3.5 shrink-0"
                                                        strokeWidth={2}
                                                    />
                                                    <span className="truncate">
                                                        {employee.email}
                                                    </span>
                                                </p>
                                            )}
                                            <p className="flex items-center gap-1.5 text-muted-foreground">
                                                <CalendarClock
                                                    className="size-3.5"
                                                    strokeWidth={2}
                                                />
                                                {formatDate(
                                                    employee.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </Link>

                                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                                            {employee.roles.length > 0 ? (
                                                employee.roles.map(
                                                    (role, index) => (
                                                        <span
                                                            key={role.id}
                                                            className={cn(
                                                                'inline-flex max-w-28 shrink-0 items-center gap-1 truncate rounded-md px-2 py-1 text-[10px] font-semibold ring-1',
                                                                roleAccent(
                                                                    index,
                                                                ),
                                                            )}
                                                        >
                                                            <ShieldCheck
                                                                className="size-3 shrink-0"
                                                                strokeWidth={2}
                                                            />
                                                            {role.name}
                                                        </span>
                                                    ),
                                                )
                                            ) : (
                                                <span className="truncate text-xs text-muted-foreground">
                                                    Belum ada role
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openAssign(employee)}
                                            className="h-7 shrink-0 gap-1 rounded-lg px-2.5 text-[11px] font-medium"
                                        >
                                            <ShieldCheck
                                                className="size-3.5"
                                                strokeWidth={2}
                                            />
                                            Assign Role
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {employees.last_page > 1 && (
                        <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Menampilkan {employees.from}–{employees.to} dari{' '}
                                {employees.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl"
                                    disabled={!employees.links[0]?.url}
                                    onClick={() =>
                                        goToPage(employees.links[0]?.url)
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                {employees.links.slice(1, -1).map((link, i) => (
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
                                        !employees.links[
                                            employees.links.length - 1
                                        ]?.url
                                    }
                                    onClick={() =>
                                        goToPage(
                                            employees.links[
                                                employees.links.length - 1
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
                        <DialogTitle>Sinkronisasi Karyawan</DialogTitle>
                        <DialogDescription>
                            Data karyawan akan diperbarui dari Portal Optigate.
                            Proses ini dapat mengubah data yang ada.
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

            <Dialog
                open={!!assignTarget}
                onOpenChange={(open) => !open && closeAssign()}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Role</DialogTitle>
                        <DialogDescription>
                            Tetapkan role untuk{' '}
                            <span className="font-semibold text-foreground">
                                {assignTarget?.nama_employee}
                            </span>
                            . Role menentukan hak akses ke modul dan fitur
                            aplikasi.
                        </DialogDescription>
                    </DialogHeader>

                    {assignErrors.roles && (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                            {assignErrors.roles}
                        </p>
                    )}

                    <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                        {allRoles.map((role) => {
                            const checked = roleForm.roles.includes(role.name);

                            return (
                                <label
                                    key={role.id}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-150',
                                        checked
                                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                                            : 'border-border/70 bg-card/40 hover:border-border hover:bg-card/70',
                                    )}
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(value) =>
                                            toggleRole(
                                                role.name,
                                                value === true,
                                            )
                                        }
                                    />
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <ShieldCheck
                                                className="size-4"
                                                strokeWidth={2}
                                            />
                                        </span>
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {role.name}
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                        {allRoles.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Belum ada role. Buat role terlebih dahulu di
                                menu Role.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeAssign}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAssign}
                            disabled={assignProcessing}
                            className="min-w-24"
                        >
                            {assignProcessing && (
                                <Spinner className="mr-2 size-4" />
                            )}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Karyawan',
            href: indexRoute().url,
        },
    ],
};
