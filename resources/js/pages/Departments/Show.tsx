import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    Crown,
    Hash,
    Inbox,
    Network,
    UserRound,
    Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { index as indexRoute } from '@/routes/departments';
import { show as showEmployee } from '@/routes/employees';

type Employee = {
    id_employee: string;
    nik_employee: string | null;
    nama_employee: string;
    email: string | null;
    photo_url: string | null;
};

type DepartmentDetail = {
    id_department: string;
    kode_department: string;
    nama_department: string | null;
    created_at: string;
    employees: Employee[];
    hod: Employee | null;
    manager: Employee | null;
};

type PageProps = {
    department: DepartmentDetail;
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function EmployeeAvatar({ employee }: { employee: Employee }) {
    const getInitials = useInitials();

    if (employee.photo_url) {
        return (
            <img
                src={employee.photo_url}
                alt={employee.nama_employee}
                className="size-9 shrink-0 rounded-xl object-cover ring-1 ring-primary/10"
            />
        );
    }

    return (
        <Avatar className="size-9 shrink-0 overflow-hidden rounded-xl">
            <AvatarFallback className="bg-gradient-to-br from-sky-500/15 to-emerald-500/15 text-xs font-semibold text-sky-600 ring-1 ring-primary/10 dark:text-sky-300">
                {getInitials(employee.nama_employee)}
            </AvatarFallback>
        </Avatar>
    );
}

function LeaderCard({ employee, role }: { employee: Employee; role: string }) {
    const isHod = role === 'Kepala Departemen';

    return (
        <div className="glass-card flex items-center gap-3.5 rounded-2xl p-4">
            {employee.photo_url ? (
                <img
                    src={employee.photo_url}
                    alt={employee.nama_employee}
                    className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-primary/10"
                />
            ) : (
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md',
                        isHod
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600',
                    )}
                >
                    <Crown className="size-4" strokeWidth={2} />
                </div>
            )}
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                    {employee.nama_employee}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {employee.email ?? '—'}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <UserRound className="size-3" strokeWidth={2} />
                    {role}
                </span>
            </div>
        </div>
    );
}

export default function DepartmentsShow() {
    const { department } = usePage().props as unknown as PageProps;

    const stats = [
        {
            label: 'Kode',
            value: department.kode_department,
            icon: Hash,
            accent: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Karyawan',
            value: String(department.employees.length),
            icon: Users,
            accent: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    const leaders = [
        { role: 'Kepala Departemen', employee: department.hod },
        { role: 'Manager', employee: department.manager },
    ].filter((l) => l.employee !== null) as {
        role: string;
        employee: Employee;
    }[];

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
                    Kembali ke Department
                </Link>

                <div className="glass-panel card-enter relative mt-5 overflow-hidden rounded-2xl p-6 md:p-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgba(245,158,11,0.14),transparent_60%)]"
                    />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg ring-1 ring-white/20">
                                <Building2
                                    className="size-6"
                                    strokeWidth={1.75}
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {department.nama_department ?? 'Department'}
                                </h1>
                                <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                                    <Network
                                        className="size-3.5 text-sky-500"
                                        strokeWidth={2}
                                    />
                                    {department.kode_department}
                                </p>
                            </div>
                        </div>
                        <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock
                                className="size-3.5"
                                strokeWidth={2}
                            />
                            Dibuat {formatDate(department.created_at)}
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

                {leaders.length > 0 && (
                    <>
                        <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-150">
                            <h2 className="text-sm font-semibold tracking-wide text-foreground">
                                Pimpinan
                            </h2>
                        </div>
                        <div className="card-enter mt-4 grid grid-cols-1 gap-4 delay-150 sm:grid-cols-2">
                            {leaders.map(({ role, employee }) => (
                                <Link
                                    key={role}
                                    href={showEmployee(employee).url}
                                    className="transition-transform duration-200 hover:-translate-y-0.5"
                                >
                                    <LeaderCard
                                        employee={employee}
                                        role={role}
                                    />
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                <div className="card-enter mt-8 flex items-center justify-between gap-2 border-b border-border/40 pb-3 delay-200">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">
                        Anggota
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                        <Users className="size-3.5" strokeWidth={1.75} />
                        {department.employees.length}
                    </span>
                </div>

                {department.employees.length === 0 ? (
                    <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-16 text-center delay-200">
                        <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                            <Inbox className="size-7" strokeWidth={1.25} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground">
                                Belum ada anggota
                            </p>
                            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                Belum ada karyawan yang terdaftar di department
                                ini.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel card-enter mt-4 flex flex-col divide-y divide-border/50 overflow-hidden rounded-2xl delay-200">
                        {department.employees.map((employee) => (
                            <Link
                                key={employee.id_employee}
                                href={showEmployee(employee).url}
                                className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-card/60"
                            >
                                <EmployeeAvatar employee={employee} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {employee.nama_employee}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {employee.email ?? '—'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

DepartmentsShow.layout = {
    breadcrumbs: [
        {
            title: 'Department',
            href: indexRoute().url,
        },
        {
            title: 'Detail',
            href: '#',
        },
    ],
};
