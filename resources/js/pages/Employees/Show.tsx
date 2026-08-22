import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    Hash,
    Inbox,
    Mail,
    Network,
    Phone,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { index as indexRoute } from '@/routes/employees';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';

type RoleOption = {
    id: number;
    name: string;
};

type EmployeeDetail = {
    id_employee: string;
    nik_employee: string | null;
    nama_employee: string;
    email: string | null;
    number: string | null;
    photo_url: string | null;
    last_login_ip: string | null;
    created_at: string;
    id_department: string | null;
    department: {
        id_department: string;
        kode_department: string;
        nama_department: string | null;
    } | null;
    roles: RoleOption[];
};

type PageProps = {
    employee: EmployeeDetail;
    roles: RoleOption[];
};

const ROLE_ACCENTS: string[] = [
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
        month: 'long',
        year: 'numeric',
    });
}

export default function EmployeeShow() {
    const { employee, roles: allRoles } = usePage().props as unknown as PageProps;
    const [assignOpen, setAssignOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const {
        data: roleForm,
        setData: setRoleForm,
        post: assignPost,
        processing: assignProcessing,
        reset: resetRoleForm,
        errors: assignErrors,
    } = useForm<{ roles: string[] }>({ roles: [] });

    const openAssign = () => {
        setRoleForm(
            'roles',
            employee.roles.map((role) => role.name),
        );
        setAssignOpen(true);
    };

    const closeAssign = () => {
        setAssignOpen(false);
        resetRoleForm();
    };

    const toggleRole = (roleName: string, checked: boolean) => {
        setRoleForm(
            'roles',
            checked
                ? [...roleForm.roles, roleName]
                : roleForm.roles.filter((name) => name !== roleName),
        );
    };

    const handleAssign = () => {
        setAssigning(true);
        assignPost(
            `/employees/${employee.id_employee}/roles`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Role karyawan berhasil diperbarui.');
                    closeAssign();
                },
                onError: () => {
                    toast.error('Gagal memperbarui role karyawan.');
                },
                onFinish: () => setAssigning(false),
            },
        );
    };

    const stats = [
        {
            label: 'NIK',
            value: employee.nik_employee ?? '—',
            icon: Hash,
            accent: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Department',
            value:
                employee.department?.nama_department ??
                    employee.department?.kode_department ??
                    '—',
            icon: Building2,
            accent: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Email',
            value: employee.email ?? '—',
            icon: Mail,
            accent: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'No. WhatsApp',
            value: employee.number ?? '—',
            icon: Phone,
            accent: 'text-rose-600 dark:text-rose-400',
        },
    ];

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.12),transparent_60%)]"
            />
            <div className="mx-auto w-full max-w-5xl">
                <Link
                    href={indexRoute().url}
                    className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Kembali ke Anggota
                </Link>

                <div className="glass-panel card-enter relative mt-5 overflow-hidden rounded-2xl p-6 md:p-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(245,158,11,0.14),transparent_60%)]"
                    />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            {employee.photo_url ? (
                                <img
                                    src={employee.photo_url}
                                    alt={employee.nama_employee}
                                    className="size-14 shrink-0 rounded-2xl object-cover shadow-lg ring-1 ring-primary/10"
                                />
                            ) : (
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 font-semibold text-white shadow-lg ring-1 ring-white/20">
                                    <span className="text-lg">
                                        {employee.nama_employee
                                            .split(' ')
                                            .slice(0, 2)
                                            .map((w) => w[0])
                                            .join('')
                                            .toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {employee.nama_employee}
                                </h1>
                                <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                                    <Network
                                        className="size-3.5 text-sky-500"
                                        strokeWidth={2}
                                    />
                                    {employee.nik_employee ?? '—'}
                                </p>
                            </div>
                        </div>
                        <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock
                                className="size-3.5"
                                strokeWidth={2}
                            />
                            Dibuat {formatDate(employee.created_at)}
                        </p>
                    </div>
                </div>

                <div className="card-enter mt-4 grid grid-cols-1 gap-4 delay-100 sm:grid-cols-2">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="glass-card flex flex-col gap-3 rounded-2xl p-4"
                        >
                            <div className="flex items-center gap-2">
                                <stat.icon
                                    className={cn('size-4', stat.accent)}
                                    strokeWidth={1.75}
                                />
                                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {stat.label}
                                </span>
                            </div>
                            <p className="truncate text-base font-semibold text-foreground tabular-nums">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {employee.last_login_ip && (
                    <div className="glass-panel card-enter mt-4 flex items-center gap-3 rounded-2xl p-4 delay-150">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            <Network className="size-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Terakhir login dari IP
                            </p>
                            <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
                                {employee.last_login_ip}
                            </p>
                        </div>
                    </div>
                )}

                <div className="glass-panel card-enter mt-4 rounded-2xl p-6 delay-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="glass-card flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-emerald-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <ShieldCheck className="size-5" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Role & Hak Akses</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {employee.roles.length > 0
                                        ? `${employee.roles.length} role ditetapkan`
                                        : 'Belum ada role'}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                variant="outline"
                                className="h-10 gap-2 rounded-xl border-sky-500/30 text-sky-700 hover:bg-sky-500/10"
                                onClick={openAssign}
                            >
                                <ShieldCheck className="size-4" />
                                Kelola Role
                            </Button>
                        </div>
                    </div>

                    {employee.roles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {employee.roles.map((role, index) => (
                                <span
                                    key={role.id}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ring-1',
                                        roleAccent(index),
                                    )}
                                >
                                    <ShieldCheck className="size-3 shrink-0" strokeWidth={2} />
                                    {role.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {employee.roles.length === 0 && (
                        <div className="mt-4 flex items-center justify-center gap-4 py-8 text-center">
                            <div className="glass-card flex size-12 items-center justify-center rounded-xl text-primary shadow-md">
                                <ShieldCheck className="size-5" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">Belum ada role</p>
                                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    Tetapkan role ke karyawan ini untuk memberikan hak akses ke modul aplikasi.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={assignOpen} onOpenChange={(open) => !open && closeAssign()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kelola Role</DialogTitle>
                        <DialogDescription>
                            Tetapkan role untuk <span className="font-semibold text-foreground">{employee.nama_employee}</span>. Role menentukan hak akses ke modul dan fitur aplikasi.
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
                                            toggleRole(role.name, value === true)
                                        }
                                    />
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <ShieldCheck className="size-4" strokeWidth={2} />
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
                                Belum ada role. Buat role terlebih dahulu di menu Role.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={closeAssign}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAssign}
                            disabled={assigning || assignProcessing}
                            className="min-w-24"
                        >
                            {assigning || assignProcessing ? (
                                <>
                                    <Spinner className="mr-2 size-4" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

EmployeeShow.layout = {
    breadcrumbs: [
        {
            title: 'Anggota',
            href: indexRoute().url,
        },
    ],
};