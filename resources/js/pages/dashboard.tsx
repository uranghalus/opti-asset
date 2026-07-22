import { Head, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Barcode,
    Building2,
    CheckCircle,
    ClipboardList,
    DollarSign,
    Package,
    Trash2,
    TrendingUp,
    Wrench,
} from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';
import { dashboard } from '@/routes';

const features = [
    {
        title: 'Manajemen Aset',
        desc: 'Lacak seluruh aset dari pengadaan hingga pemutihan dalam satu platform terpadu.',
        icon: Package,
        gradient: 'from-[#006FCF] to-[#00509E]',
        bg: 'bg-[#006FCF]/[0.06]',
        ring: 'ring-[#006FCF]/20',
        text: 'text-[#006FCF]',
    },
    {
        title: 'Pemindaian Barcode',
        desc: 'Temukan data aset secara instan dengan pemindaian barcode yang cepat dan akurat.',
        icon: Barcode,
        gradient: 'from-[#00875A] to-[#006644]',
        bg: 'bg-[#00875A]/[0.06]',
        ring: 'ring-[#00875A]/20',
        text: 'text-[#00875A]',
    },
    {
        title: 'Transfer Aset',
        desc: 'Pindahkan aset antar departemen dengan alur persetujuan yang terstruktur.',
        icon: ArrowRightLeft,
        gradient: 'from-[#BF9B30] to-[#9A7C26]',
        bg: 'bg-[#BF9B30]/[0.06]',
        ring: 'ring-[#BF9B30]/20',
        text: 'text-[#BF9B30]',
    },
    {
        title: 'Disposal Aset',
        desc: 'Kelola proses disposisi dari pengajuan hingga persetujuan secara otomatis.',
        icon: Trash2,
        gradient: 'from-[#B95000] to-[#8A3A00]',
        bg: 'bg-[#B95000]/[0.06]',
        ring: 'ring-[#B95000]/20',
        text: 'text-[#B95000]',
    },
] as const;

const stats = [
    { label: 'Total Aset', value: '1,248', change: '+52', icon: Package, color: 'text-[#006FCF]', bg: 'bg-[#006FCF]/[0.08]' },
    { label: 'Aktif', value: '1,089', change: '87%', icon: CheckCircle, color: 'text-[#00875A]', bg: 'bg-[#00875A]/[0.08]' },
    { label: 'Maintenance', value: '67', change: '+8', icon: Wrench, color: 'text-[#B95000]', bg: 'bg-[#B95000]/[0.08]' },
    { label: 'Nilai Total', value: 'Rp 12.4B', change: '+Rp 850M', icon: DollarSign, color: 'text-[#BF9B30]', bg: 'bg-[#BF9B30]/[0.08]' },
] as const;

const departments = [
    { name: 'IT', count: 312, pct: 25, color: '#006FCF' },
    { name: 'Operations', count: 234, pct: 18.7, color: '#00175A' },
    { name: 'Finance', count: 198, pct: 15.9, color: '#BF9B30' },
    { name: 'Marketing', count: 156, pct: 12.5, color: '#00875A' },
    { name: 'Admin', count: 145, pct: 11.6, color: '#0891B2' },
    { name: 'HR', count: 89, pct: 7.1, color: '#7C3AED' },
    { name: 'Legal', count: 67, pct: 5.4, color: '#E11D48' },
    { name: 'Other', count: 47, pct: 3.8, color: '#86888C' },
];

const recentMovements = [
    { asset: 'Laptop Dell XPS 15', from: 'IT Dept', to: 'Finance', status: 'Selesai', date: '22 Jul', color: '#00875A' },
    { asset: 'Printer HP LaserJet', from: 'Admin', to: 'Marketing', status: 'Menunggu', date: '21 Jul', color: '#BF9B30' },
    { asset: 'Monitor LG 27"', from: 'IT Dept', to: 'HR', status: 'Selesai', date: '21 Jul', color: '#00875A' },
    { asset: 'Meja Kerja Ergonomis', from: 'Warehouse', to: 'Operations', status: 'Ditolak', date: '20 Jul', color: '#C52720' },
    { asset: 'Kursi Herman Miller', from: 'Finance', to: 'IT Dept', status: 'Selesai', date: '20 Jul', color: '#00875A' },
];

const activityItems = [
    { text: 'Laptop Dell XPS 15 dipindahkan ke Finance', time: '2 jam lalu', type: 'transfer' },
    { text: '12 aset baru ditambahkan ke kategori Elektronik', time: '3 jam lalu', type: 'create' },
    { text: 'Printer HP LaserJet menunggu persetujuan', time: '5 jam lalu', type: 'pending' },
    { text: 'Laporan disposisi Q3 telah dihasilkan', time: 'Kemarin', type: 'report' },
    { text: 'Pemindaian barcode selesai untuk 847 aset', time: 'Kemarin', type: 'scan' },
];

function WelcomeHero() {
    const { auth } = usePage().props;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';
    const ref = useReveal();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Selamat pagi' : hour < 18 ? 'Selamat siang' : 'Selamat malam';

    return (
        <div ref={ref} className="reveal">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#006FCF] via-[#00509E] to-[#00175A] p-8 lg:p-10">
                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">
                            Dashboard
                        </p>
                        <h1
                            className="text-3xl font-semibold tracking-tight text-white lg:text-4xl"
                            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)' }}
                        >
                            {greeting}, {name}
                        </h1>
                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
                            Ringkasan portofolio aset perusahaan hari ini. Anda memiliki{' '}
                            <span className="font-semibold text-white">8 permintaan</span> yang menunggu persetujuan.
                        </p>
                    </div>

                    <div className="flex shrink-0 gap-3">
                        {[
                            { value: '1,248', label: 'Total', color: 'bg-white/10' },
                            { value: '38', label: 'Permintaan', color: 'bg-[#BF9B30]/20' },
                            { value: '99.2%', label: 'Uptime', color: 'bg-[#00875A]/20' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className={`flex flex-col items-center rounded-xl ${item.color} px-5 py-3 backdrop-blur-sm`}
                            >
                                <span className="text-xl font-bold tracking-tight text-white">{item.value}</span>
                                <span className="text-[10px] font-medium tracking-wide text-white/50">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/[0.04] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-[#BF9B30]/[0.06] blur-3xl" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>
        </div>
    );
}

function StatCard({ label, value, change, icon: Icon, color, bg, delay }: {
    label: string;
    value: string;
    change: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    delay: number;
}) {
    const ref = useReveal();

    return (
        <div ref={ref} className={`reveal delay-${delay} group`}>
            <div className="bezel-outer transition-all duration-500 hover:shadow-lg hover:shadow-black/[0.04]">
                <div className="flex items-center gap-4 p-5">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`size-5 ${color}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium tracking-wide text-[#86888C] uppercase">{label}</p>
                        <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#1A1A1A] dark:text-white">{value}</p>
                        <p className={`text-xs font-medium ${color}`}>{change}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ title, desc, icon: Icon, gradient, bg, ring, text, delay }: {
    title: string;
    desc: string;
    icon: React.ElementType;
    gradient: string;
    bg: string;
    ring: string;
    text: string;
    delay: number;
}) {
    const ref = useReveal();

    return (
        <div ref={ref} className={`reveal delay-${delay} group`}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_3px_rgba(0,23,90,0.04)] transition-all duration-700 hover:shadow-[0_8px_40px_rgba(0,23,90,0.08)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_8px_40px_rgba(0,111,207,0.08)]">
                <div className={`mb-5 inline-flex size-12 items-center justify-center rounded-2xl ${bg} ring-1 ${ring} transition-transform duration-700 group-hover:scale-110`}>
                    <Icon className={`size-5 ${text}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                    {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#53565A] dark:text-[#B7C3D9]">
                    {desc}
                </p>
                <div className={`absolute -bottom-8 -right-8 size-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.04] transition-opacity duration-700 group-hover:opacity-[0.08] dark:opacity-[0.06] dark:group-hover:opacity-[0.12]`} />
            </div>
        </div>
    );
}

function DepartmentBar({ name, count, pct, color }: {
    name: string;
    count: number;
    pct: number;
    color: string;
}) {
    return (
        <div className="group flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-medium text-[#53565A] dark:text-[#B7C3D9]">{name}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: 0.15,
                    }}
                />
                <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out"
                    style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                        opacity: 0.85,
                    }}
                />
                <span className="relative z-10 flex h-full items-center px-3 text-xs font-semibold text-[#1A1A1A] dark:text-white">
                    {count}
                </span>
            </div>
            <span className="w-12 shrink-0 text-right text-[11px] font-medium text-[#86888C]">{pct}%</span>
        </div>
    );
}

function ActivityItem({ text, time, type, index }: {
    text: string;
    time: string;
    type: string;
    index: number;
}) {
    const colors: Record<string, string> = {
        transfer: '#006FCF',
        create: '#00875A',
        pending: '#BF9B30',
        report: '#7C3AED',
        scan: '#0891B2',
    };
    const color = colors[type] ?? '#86888C';

    return (
        <div className="flex items-start gap-3">
            <div className="relative mt-1">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                {index < activityItems.length - 1 && (
                    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-px h-8 bg-black/[0.06] dark:bg-white/[0.06]" />
                )}
            </div>
            <div className="min-w-0 flex-1 pb-6">
                <p className="text-sm font-medium leading-snug text-[#1A1A1A] dark:text-white">{text}</p>
                <p className="mt-0.5 text-[11px] text-[#86888C]">{time}</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <WelcomeHero />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <StatCard key={stat.label} {...stat} delay={100 + i * 50} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.title} {...feature} delay={200 + i * 75} />
                    ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <DepartmentSection />
                    </div>
                    <div className="lg:col-span-4">
                        <ActivitySection />
                    </div>
                </div>

                <MovementsTable />
            </div>
        </>
    );
}

function DepartmentSection() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-300">
            <div className="bezel-outer h-full">
                <div className="bezel-inner p-6">
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#006FCF] uppercase">
                        Distribusi
                    </p>
                    <h3 className="mb-6 text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                        Aset per Departemen
                    </h3>
                    <div className="flex flex-col gap-3">
                        {departments.map((d) => (
                            <DepartmentBar key={d.name} {...d} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivitySection() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-400">
            <div className="bezel-outer h-full">
                <div className="bezel-inner p-6">
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#00875A] uppercase">
                        Aktivitas
                    </p>
                    <h3 className="mb-5 text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                        Aktivitas Terkini
                    </h3>
                    <div>
                        {activityItems.map((item, i) => (
                            <ActivityItem key={i} {...item} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MovementsTable() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-300">
            <div className="bezel-outer">
                <div className="bezel-inner p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#BF9B30] uppercase">
                                Pergerakan
                            </p>
                            <h3 className="text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                                Transfer Aset Terbaru
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-[#ECEDEE] bg-[#F7F8F9] px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                            <TrendingUp className="size-3.5 text-[#006FCF]" />
                            <span className="text-xs font-medium text-[#53565A] dark:text-[#B7C3D9]">Minggu ini</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#ECEDEE] dark:border-white/[0.06]">
                                    <th className="pb-3 text-[11px] font-semibold tracking-wide text-[#86888C] uppercase">Aset</th>
                                    <th className="pb-3 text-[11px] font-semibold tracking-wide text-[#86888C] uppercase">Dari</th>
                                    <th className="pb-3 text-[11px] font-semibold tracking-wide text-[#86888C] uppercase">Ke</th>
                                    <th className="pb-3 text-[11px] font-semibold tracking-wide text-[#86888C] uppercase">Status</th>
                                    <th className="pb-3 text-[11px] font-semibold tracking-wide text-[#86888C] uppercase">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMovements.map((m, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-[#F7F8F9] transition-colors hover:bg-[#F7F8F9]/50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="py-3.5 font-medium text-[#1A1A1A] dark:text-white">{m.asset}</td>
                                        <td className="py-3.5 text-[#53565A] dark:text-[#B7C3D9]">{m.from}</td>
                                        <td className="py-3.5 text-[#53565A] dark:text-[#B7C3D9]">{m.to}</td>
                                        <td className="py-3.5">
                                            <span
                                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                                style={{
                                                    color: m.color,
                                                    backgroundColor: `${m.color}15`,
                                                }}
                                            >
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-xs text-[#86888C]">{m.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
