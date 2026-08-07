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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { index as indexRoute } from '@/routes/employees';

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
};

type PageProps = {
    employee: EmployeeDetail;
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function EmployeeShow() {
    const { employee } = usePage().props as unknown as PageProps;

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

                <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-16 text-center delay-200">
                    <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                        <Inbox className="size-7" strokeWidth={1.25} />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-foreground">
                            Informasi lengkap segera hadir
                        </p>
                        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            Detail tambahan anggota (jabatan, tim, dan
                            lain-lain) akan ditampilkan di sini.
                        </p>
                    </div>
                </div>
            </div>
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
