import { Head, usePage } from '@inertiajs/react';
import { Activity, AlertTriangle, BarChart3, Building2, CalendarDays, Download, Inbox, Layers, MapPin, MoveRight, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { cn } from '@/lib/utils';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { WarrantyAlerts } from '@/components/dashboard/warranty-alerts';
import { EmptyState } from '@/components/empty-state';

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

type ClassificationSlice = { name: string; count: number };
type LocationSlice = { name: string; count: number };
type RecentTransfer = { id: string; asset_kode: string; from: string; to: string; status: string; date: string };
type RecentDisposal = { id: string; asset_kode: string; reason: string; status: string; date: string };
type WarrantyAsset = { id: string; kode_asset: string | null; brand: string | null; model: string | null; warranty_expire: string; days_until: number };
type WarrantyAlerts = { expired: number; expiring_soon: number; expiring_30: number; assets: WarrantyAsset[] };

type PageProps = {
    stats: Stats;
    asset_by_classification: ClassificationSlice[];
    asset_by_location: LocationSlice[];
    recent_transfers: RecentTransfer[];
    recent_disposals: RecentDisposal[];
    integrity_score: number;
    warranty_alerts: WarrantyAlerts;
};

function GreetingHeader({ name, score }: { name: string; score: number }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Selamat pagi' : hour < 18 ? 'Selamat siang' : 'Selamat malam';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002A6E] via-[#00175A] to-[#000C3D] p-6 shadow-lg shadow-[#00175A]/20 sm:p-7">
            <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-[#006FCF]/25 blur-3xl" />
            <div className="pointer-events-none absolute top-8 right-32 size-32 rounded-full bg-[#3B9FE8]/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-[#8FB4E8] uppercase">{greeting}</p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">Halo, {name}</h1>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#B7C3D9]">
                        Ringkasan portofolio aset hari ini. Skor kelengkapan klasifikasi: <span className="font-semibold text-white">{score}%</span> (target 95%).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-white/15 bg-white/[0.06] px-3 text-[13px] font-medium text-white backdrop-blur-sm hover:bg-white/[0.12] hover:text-white">
                        <CalendarDays className="h-4 w-4 text-[#8FB4E8]" />
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Button>
                    <Button size="sm" className="h-9 gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-[#00175A] shadow-sm hover:bg-white/90">
                        <Download className="h-4 w-4" />
                        Ekspor
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ClassificationBars({ slices }: { slices: ClassificationSlice[] }) {
    const max = Math.max(1, ...slices.map((s) => s.count));
    if (slices.length === 0) {
        return <EmptyState icon={Layers} title="Belum ada klasifikasi" description="Buat Golongan untuk mulai mengelompokkan aset." />;
    }
    return (
        <ul className="flex flex-col gap-2.5">
            {slices.map((s) => {
                const pct = Math.round((s.count / max) * 100);
                return (
                    <li key={s.name} className="flex items-center gap-3 text-sm">
                        <span className="w-32 shrink-0 truncate font-medium text-foreground">{s.name}</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#006FCF] to-[#3B9FE8]"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{s.count} ({pct}%)</span>
                    </li>
                );
            })}
        </ul>
    );
}

function LocationStack({ slices }: { slices: LocationSlice[] }) {
    const max = Math.max(1, ...slices.map((s) => s.count));
    if (slices.length === 0) {
        return <EmptyState icon={MapPin} title="Belum ada lokasi" description="Tetapkan lokasi pada aset untuk melihat distribusinya." />;
    }
    return (
        <ul className="flex flex-col divide-y divide-border/40">
            {slices.map((s) => {
                const pct = Math.round((s.count / max) * 100);
                return (
                    <li key={s.name} className="flex items-center gap-3 py-2 text-sm">
                        <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                            <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{s.count}</span>
                    </li>
                );
            })}
        </ul>
    );
}

function MiniLedger({ rows, kind }: { rows: RecentTransfer[] | RecentDisposal[]; kind: 'transfer' | 'disposal' }) {
    if (rows.length === 0) {
        return <EmptyState icon={Inbox} title={kind === 'transfer' ? 'Belum ada mutasi' : 'Belum ada disposal'} description={kind === 'transfer' ? 'Mutasi yang disetujui akan muncul di sini.' : 'Pengajuan disposal akan muncul di sini.'} />;
    }
    return (
        <div className="flex flex-col">
            <div className="hidden grid-cols-12 gap-2 border-b border-border/60 px-2 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:grid">
                <span className="col-span-4">Kode</span>
                <span className="col-span-4">{kind === 'transfer' ? 'Dari → Ke' : 'Alasan'}</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2 text-right">Tanggal</span>
            </div>
            {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-1 gap-1 border-b border-border/40 px-2 py-2 text-sm last:border-b-0 sm:grid-cols-12 sm:items-center sm:gap-2">
                    <span className="font-mono text-xs font-semibold text-primary sm:col-span-4">{r.asset_kode}</span>
                    <span className="text-xs text-muted-foreground sm:col-span-4">{kind === 'transfer' ? `${(r as RecentTransfer).from} → ${(r as RecentTransfer).to}` : (r as RecentDisposal).reason}</span>
                    <span className="sm:col-span-2"><span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/15">{r.status}</span></span>
                    <span className="text-xs tabular-nums text-muted-foreground sm:col-span-2 sm:text-right">{new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const { stats, asset_by_classification, asset_by_location, recent_transfers, recent_disposals, integrity_score, warranty_alerts } = usePage().props as unknown as PageProps;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';
    const integrityGood = integrity_score >= 95;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
                <GreetingHeader name={name} score={integrity_score} />

                <KpiCards stats={stats} />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <section className="glass-panel relative flex min-h-[280px] flex-col gap-4 rounded-2xl p-5 lg:col-span-2">
                        <header className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-[#006FCF] uppercase">FR-10.1</p>
                                <h3 className="mt-1 text-base font-semibold">Aset per Klasifikasi</h3>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                                <ShieldCheck className="size-3" />
                                {integrityGood ? 'Target Tercapai' : 'Di Bawah Target'}
                            </span>
                        </header>
                        <ClassificationBars slices={asset_by_classification} />
                    </section>
                    <StatusDonut stats={stats} />
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-[#8B5CF6] uppercase">FR-10.3</p>
                                <h3 className="mt-1 text-base font-semibold">Aset per Lokasi</h3>
                            </div>
                            <BarChart3 className="size-4 text-muted-foreground" />
                        </header>
                        <LocationStack slices={asset_by_location} />
                    </section>

                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-[#B95000] uppercase">FR-10.4</p>
                                <h3 className="mt-1 text-base font-semibold">Mutasi Terkini</h3>
                            </div>
                            <MoveRight className="size-4 text-muted-foreground" />
                        </header>
                        <MiniLedger rows={recent_transfers} kind="transfer" />
                    </section>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">FR-10.5</p>
                                <h3 className="mt-1 text-base font-semibold">Disposal Terkini</h3>
                            </div>
                            <Trash2 className="size-4 text-muted-foreground" />
                        </header>
                        <MiniLedger rows={recent_disposals} kind="disposal" />
                    </section>

                    <section className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
                        <header className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-amber-600 uppercase">Peringatan</p>
                                <h3 className="mt-1 text-base font-semibold">Garansi & Risiko</h3>
                            </div>
                            <AlertTriangle className="size-4 text-muted-foreground" />
                        </header>
                        <WarrantyAlerts alerts={warranty_alerts} />
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
