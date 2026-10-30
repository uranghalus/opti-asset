import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CalendarDays,
    Check,
    Clock,
    Download,
    Inbox,
    Layers,
    MapPin,
    MoveRight,
    ShieldCheck,
    Trash2,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/tenant';

type AssetByStatus = {
    ACT: number;
    LOAN: number;
    RPR: number;
    MUT: number;
    DSP: number;
};

type Stats = {
    total_assets: number;
    asset_by_status: AssetByStatus;
    pending_transfers: number;
    pending_disposals: number;
};

type ClassificationSlice = {
    name: string;
    count: number;
    tipe?: string | null;
};
type AssetTypeSlice = {
    type: string;
    label: string;
    count: number;
    value: string;
    book_value: string;
};
type LocationSlice = { name: string; count: number };
type RecentTransfer = {
    id: string;
    asset_kode: string;
    from: string;
    to: string;
    status: string;
    date: string;
};
type RecentDisposal = {
    id: string;
    asset_kode: string;
    reason: string;
    status: string;
    date: string;
};
type WarrantyAsset = {
    id: string;
    kode_asset: string | null;
    brand: string | null;
    model: string | null;
    warranty_expire: string;
    days_until: number;
};
type WarrantyAlerts = {
    expired: number;
    expiring_soon: number;
    expiring_30: number;
    assets: WarrantyAsset[];
};

type PageProps = {
    stats: Stats;
    asset_by_classification: ClassificationSlice[];
    asset_by_type: AssetTypeSlice[];
    asset_by_location: LocationSlice[];
    recent_transfers: RecentTransfer[];
    recent_disposals: RecentDisposal[];
    integrity_score: number;
    warranty_alerts: WarrantyAlerts;
};

const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fd = (iso: string) => {
    if (!iso) {
return '—';
}

    const p = iso.split('-');

    return `${+p[2]} ${BLN[+p[1] - 1]} ${p[0]}`;
};

const num = (n: number) => Math.round(n).toLocaleString('id-ID');

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
    Aktif: { color: 'text-status-act-text', bg: 'bg-status-act-bg' },
    Dipinjamkan: { color: 'text-text-primary', bg: 'bg-brand-subtle' },
    'Dalam Perbaikan': { color: 'text-text-primary', bg: 'bg-status-rpr-bg' },
    Dimutasi: { color: 'text-text-primary', bg: 'bg-brand-subtle' },
    Dihapus: { color: 'text-text-primary', bg: 'bg-destructive/10' },
};

const STATUS_ICON: Record<string, typeof Check> = {
    Aktif: Check,
    Dipinjamkan: Inbox,
    'Dalam Perbaikan': Clock,
    Dimutasi: MoveRight,
    Dihapus: Trash2,
};

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number | string;
    sub: string;
    icon: typeof Check;
    tone: string;
}) {
    return (
        <div className="rounded-[16px] border border-border-subtle bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-[2] hover:shadow-[0_16px_40px_rgba(0,0,0,0.42)]">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.09em] uppercase text-text-tertiary">
                    {label}
                </p>
                <div className={`size-8 rounded-[10px] flex items-center justify-center ${tone}`}>
                    <Icon className="size-5" />
                </div>
            </div>
            <div className="mt-2">
                <p className="text-[27px] font-bold leading-none text-text-primary font-heading">
                    {num(typeof value === 'number' ? value : 0)}
                </p>
                <p className="text-[11.5px] text-text-tertiary">{sub}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_BADGE[status] ?? { color: 'text-text-tertiary', bg: 'bg-card-2' };
    const Icon = STATUS_ICON[status] ?? Check;

    return (
        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.color} ${style.bg} ring-1 ring-border-subtle`}>
            <Icon className="size-3 mr-1.5" />
            {status}
        </Badge>
    );
}

function KpiRow({ stats }: { stats: Stats }) {
    const cnt = (s: keyof AssetByStatus) => stats.asset_by_status[s];
    const kpis = [
        {
            label: 'Total Aset',
            value: stats.total_assets,
            sub: 'Seluruh aset tercatat',
            icon: Building2,
            tone: 'bg-brand/10 text-brand border border-brand/20',
        },
        {
            label: 'Aset Aktif',
            value: cnt('ACT'),
            sub: `${Math.round((cnt('ACT') / stats.total_assets) * 100)}% dari total`,
            icon: Check,
            tone: 'bg-status-act-bg/20 text-status-act-text border border-status-act-border/40',
        },
        {
            label: 'Dipinjamkan',
            value: cnt('LOAN'),
            sub: 'di 2 departemen',
            icon: Inbox,
            tone: 'bg-brand-subtle/20 text-text-primary border border-brand/30',
        },
        {
            label: 'Dalam Perbaikan',
            value: cnt('RPR'),
            sub: '1 unit proyektor',
            icon: Clock,
            tone: 'bg-status-rpr-bg/20 text-text-primary border border-status-rpr-border/40',
        },
        {
            label: 'Disposal Diajukan',
            value: stats.pending_disposals,
            sub: `${stats.pending_disposals > 0 ? stats.pending_disposals : 0} disetujui (YTD)`,
            icon: Trash2,
            tone: 'bg-destructive/10 text-destructive border border-destructive/30',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k) => (
                <KpiCard key={k.label} {...k} />
            ))}
        </div>
    );
}

function TypeBreakdownCard({ slices }: { slices: AssetTypeSlice[] }) {
    const at = slices.filter((s) => s.type === 'Aktiva Tetap');
    const pr = slices.filter((s) => s.type === 'Peralatan');
    const sumAt = at.reduce((acc, s) => acc + Number(s.value.replace(/[^0-9]/g, '')), 0);
    const sumPr = pr.reduce((acc, s) => acc + Number(s.value.replace(/[^0-9]/g, '')), 0);
    const sumBook = at.reduce(
        (acc, s) => acc + Number(s.book_value.replace(/[^0-9]/g, '')),
        0,
    );
    const pctAt = Math.round((at.reduce((a, s) => a + s.count, 0) / slices.reduce((a, s) => a + s.count, 0)) * 100);

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-heading font-bold text-text-primary">
                    Breakdown Tipe Aset
                </CardTitle>
                <CardDescription className="text-[11px] text-text-tertiary">
                    FR-13.8 · Ambang batas: <span className="text-brand font-heading">Rp10.000.000</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2 h-2 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] mb-4">
                    <div
                        className="h-full bg-gradient-to-br from-brand to-brand-2"
                        style={{ width: `${pctAt}%` }}
                    />
                    <div className="h-full bg-border-highlight" />
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="size-6 rounded-[10px] bg-brand/10 text-brand flex items-center justify-center">
                            <Building2 className="size-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-text-primary">Aktiva Tetap</p>
                            <p className="text-[11px] text-text-tertiary">
                                {at.reduce((a, s) => a + s.count, 0)} unit ({pctAt}%)
                            </p>
                        </div>
                    </div>
                    <div className="text-[11px] text-text-tertiary space-y-1">
                        <div className="flex justify-between">
                            <span>Nilai perolehan</span>
                            <span className="font-mono text-[11px]">{num(sumAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total nilai buku</span>
                            <span className="font-mono text-[11px] text-brand">{num(sumBook)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="size-6 rounded-[10px] bg-card-2 text-text-tertiary flex items-center justify-center border border-border-subtle">
                            <Layers className="size-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-text-primary">Peralatan</p>
                            <p className="text-[11px] text-text-tertiary">
                                {pr.reduce((a, s) => a + s.count, 0)} unit
                            </p>
                        </div>
                    </div>
                    <div className="text-[11px] text-text-tertiary space-y-1">
                        <div className="flex justify-between">
                            <span>Total nilai perolehan</span>
                            <span className="font-mono text-[11px]">{num(sumPr)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Data akuntansi</span>
                            <span className="font-mono text-[11px] text-text-tertiary">tidak berlaku</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusDonutCard({ stats }: { stats: Stats }) {
    const data = Object.entries(stats.asset_by_status)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
            key,
            name: key,
            value,
        }));

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const C = 2 * Math.PI * 54;
    let offset = 0;

    const STATUS_COLORS: Record<string, string> = {
        Aktif: '#34D399',
        Dipinjamkan: '#60A5FA',
        'Dalam Perbaikan': '#FBBF24',
        Dimutasi: '#A78BFA',
        Dihapus: '#F87171',
    };

    const SEGMENTS = [
        { key: 'Aktif', color: '#34D399' },
        { key: 'Dipinjamkan', color: '#60A5FA' },
        { key: 'Dalam Perbaikan', color: '#FBBF24' },
        { key: 'Dimutasi', color: '#A78BFA' },
        { key: 'Dihapus', color: '#F87171' },
    ];

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-heading font-bold text-text-primary">
                    Distribusi Status
                </CardTitle>
                <CardDescription className="text-[11px] text-text-tertiary">
                    Siklus hidup aset (ACT · LOAN · RPR · MUT · DSP)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                    <div className="relative size-32 shrink-0">
                        <svg width="150" height="150" viewBox="0 0 150 150">
                            {SEGMENTS.map((seg) => {
                                const d = data.find((x) => x.key === seg.key);
                                const n = d?.value ?? 0;

                                if (n === 0) {
return null;
}

                                const f = n / total;
                                const dash = `${Math.max(f * C - 2, 0.5)} ${C}`;
                                offset += f;

                                return (
                                    <circle
                                        key={seg.key}
                                        cx="75"
                                        cy="75"
                                        r="54"
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth="15"
                                        strokeDasharray={dash}
                                        transform={`rotate(${-90 + (offset - f) * 360} 75 75)`}
                                    />
                                );
                            })}
                            <text
                                x="75"
                                y="72"
                                textAnchor="middle"
                                className="text-[24px] font-bold fill-text-primary font-heading"
                            >
                                {total}
                            </text>
                            <text
                                x="75"
                                y="92"
                                textAnchor="middle"
                                className="text-[10px] fill-text-tertiary"
                            >
                                aset tercatat
                            </text>
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        {data.map((d) => (
                            <div
                                key={d.key}
                                className="flex items-center gap-2 text-[12px]"
                            >
                                <i
                                    className="size-1.5 rounded-[3px] shrink-0"
                                    style={{ backgroundColor: STATUS_COLORS[d.key] }}
                                />
                                <span className="text-text-secondary">{d.name}</span>
                                <span className="ml-auto font-mono text-[12px]">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ClassificationBarsCard({
    slices,
    className,
}: {
    slices: ClassificationSlice[];
    className?: string;
}) {
    const gc: Record<string, number> = {};
    slices.forEach((s) => {
        gc[s.name] = (gc[s.name] ?? 0) + s.count;
    });
    const entries = Object.entries(gc).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, c]) => c), 1);

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-heading font-bold text-text-primary">
                    Aset per Klasifikasi
                </CardTitle>
                <CardDescription className="text-[11px] text-text-tertiary">
                    Struktur Group › Category › Cluster › Sub-cluster
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {entries.map(([group, count]) => (
                        <div key={group} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="text-text-secondary">{group}</span>
                                <span className="font-mono font-bold">{count} aset</span>
                            </div>
                            <div className="h-[9px] rounded-full bg-card-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand to-brand-2"
                                    style={{ width: `${(count / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityTimeline({
    transfers,
    disposals,
    className,
}: {
    transfers: RecentTransfer[];
    disposals: RecentDisposal[];
    className?: string;
}) {
    const items = [
        ...transfers.map((t) => ({ ...t, type: 'mutasi' as const })),
        ...disposals.map((d) => ({ ...d, type: 'disposal' as const })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    if (items.length === 0) {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <CardHeader>
                    <CardTitle className="text-sm font-heading font-bold text-text-primary">
                        Aktivitas Terbaru
                    </CardTitle>
                    <CardDescription className="text-[11px] text-text-tertiary">
                        Audit trail — siapa, kapan, apa yang berubah
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary text-sm">
                        Belum ada aktivitas terbaru
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-heading font-bold text-text-primary">
                    Aktivitas Terbaru
                </CardTitle>
                <CardDescription className="text-[11px] text-text-tertiary">
                    Audit trail — siapa, kapan, apa yang berubah
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="relative pl-2">
                    <div className="absolute left-1 top-32 bottom-0 w-[1.5px] bg-border-subtle" />
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="flex gap-3 relative pb-6 last:pb-0"
                        >
                            <div
                                className={`size-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                    item.status === 'Disetujui'
                                        ? 'bg-status-act-bg text-status-act-text border border-status-act-border'
                                        : 'bg-card-2 text-text-tertiary border border-border-subtle'
                                }`}
                            >
                                <Check className="size-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary">
                                    {item.asset_kode} — {item.type === 'mutasi' ? 'Mutasi diajukan' : 'Disposal diajukan'}
                                </p>
                                <p className="text-[12px] text-text-tertiary">
                                    {item.type === 'mutasi'
                                        ? `${item.from} → ${item.to}`
                                        : item.reason}
                                </p>
                            </div>
                            <span className="text-[11px] text-text-tertiary whitespace-nowrap pt-1">
                                {new Date(item.date).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                })}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PendingMutasiTable({ transfers }: { transfers: RecentTransfer[] }) {
    const pending = transfers.filter((m) => m.status === 'Menunggu');

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-heading font-bold text-text-primary">
                    Pengajuan Mutasi Menunggu Persetujuan
                </CardTitle>
                <CardDescription className="text-[11px] text-text-tertiary">
                    Lokasi aset diperbarui otomatis setelah disetujui (FR-06.5)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left">
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 pl-4">
                                    ID
                                </th>
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 pl-4">
                                    Aset
                                </th>
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 pl-4">
                                    Asal → Tujuan
                                </th>
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 pl-4">
                                    Tanggal
                                </th>
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 pl-4">
                                    Diajukan
                                </th>
                                <th className="text-[10px] font-bold tracking-[0.09em] uppercase text-text-tertiary pb-2 text-right pr-4">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.length > 0 ? (
                                pending.map((m) => (
                                    <tr key={m.id} className="border-b border-border-subtle">
                                        <td className="py-3 pl-4 font-mono text-xs">
                                            {m.id}
                                        </td>
                                        <td className="py-3 pl-4">
                                            <p className="font-medium text-text-primary">{m.asset_kode}</p>
                                        </td>
                                        <td className="py-3 pl-4">
                                            <p className="text-sm text-text-secondary">
                                                {m.from}
                                                <span className="text-brand mx-1">→</span>
                                                {m.to}
                                            </p>
                                        </td>
                                        <td className="py-3 pl-4 text-xs text-text-tertiary">
                                            {fd(m.date)}
                                        </td>
                                        <td className="py-3 pl-4 text-xs text-text-secondary">
                                            {m.id.includes('MUT') ? 'Staff Asset' : 'System'}
                                        </td>
                                        <td className="py-3 pl-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 rounded-[8px] text-brand-2 hover:text-brand border-transparent"
                                                    onClick={() => {
                                                        // approve
                                                    }}
                                                >
                                                    <Check className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="size-7 rounded-[8px] text-destructive hover:text-red/90 border-transparent"
                                                    onClick={() => {
                                                        // reject
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-6 text-center text-text-tertiary text-sm"
                                    >
                                        Tidak ada pengajuan menunggu ✓
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const {
        stats,
        asset_by_classification,
        asset_by_type,
        asset_by_location,
        recent_transfers,
        recent_disposals,
        integrity_score,
        warranty_alerts,
    } = usePage().props as unknown as PageProps;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                {/* KPI Row */}
                <KpiRow stats={stats} />

                {/* Row 2: 3-column grid */}
                <div className="grid gap-5 md:grid-cols-3">
                    <TypeBreakdownCard slices={asset_by_type} />
                    <StatusDonutCard stats={stats} />
                    <ClassificationBarsCard slices={asset_by_classification} className="md:col-span-2" />
                </div>

                {/* Row 3: Timeline (span2) + Pending Mutasi */}
                <div className="grid gap-5 md:grid-cols-3">
                    <ActivityTimeline
                        transfers={recent_transfers}
                        disposals={recent_disposals}
                        className="md:col-span-2"
                    />
                    <PendingMutasiTable transfers={recent_transfers} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
