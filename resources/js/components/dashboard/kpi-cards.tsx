import { ArrowDownRight, ArrowUpRight, Package, CheckCircle, Wrench, DollarSign } from 'lucide-react';

const kpiData = [
    {
        label: 'Total Aset',
        value: '1,248',
        change: '+5.2%',
        trend: 'up' as const,
        icon: Package,
        sparkline: [30, 35, 28, 42, 38, 50, 45, 55, 48, 62, 58, 65],
        color: '#006FCF',
    },
    {
        label: 'Aktif',
        value: '1,089',
        change: '+3.8%',
        trend: 'up' as const,
        icon: CheckCircle,
        sparkline: [40, 38, 45, 42, 50, 48, 55, 52, 60, 58, 62, 68],
        color: '#00875A',
    },
    {
        label: 'Maintenance',
        value: '67',
        change: '-2.1%',
        trend: 'down' as const,
        icon: Wrench,
        sparkline: [20, 25, 18, 22, 15, 20, 16, 12, 18, 14, 10, 8],
        color: '#B95000',
    },
    {
        label: 'Nilai Total',
        value: 'Rp 12.4B',
        change: '+8.5%',
        trend: 'up' as const,
        icon: DollarSign,
        sparkline: [35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70, 75],
        color: '#BF9B30',
    },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 28;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;

        return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;

    const areaD = `${pathD} L${width},${height} L0,${height} Z`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function KpiCards() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => {
                const Icon = kpi.icon;

                return (
                    <div
                        key={kpi.label}
                        className="group relative overflow-hidden rounded-2xl border border-[#D5D9DC] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-black/[0.06] dark:border-[#1e293b] dark:bg-[#0f172a] dark:hover:shadow-black/40"
                    >
                        {/* Top accent bar reveals the KPI's brand color on hover */}
                        <span
                            className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                            style={{ backgroundColor: kpi.color }}
                        />
                        <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${kpi.color}10` }}>
                                <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                            </div>
                            <div
                                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${kpi.trend === 'up'
                                        ? 'bg-[#00875A]/[0.08] text-[#00875A]'
                                        : 'bg-[#C52720]/[0.08] text-[#C52720]'
                                    }`}
                            >
                                {kpi.trend === 'up' ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {kpi.change}
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#86888C]">
                                {kpi.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-[#1A1A1A] dark:text-white">
                                {kpi.value}
                            </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[#ECEDEE] pt-3 dark:border-[#1e293b]">
                            <span className="text-[10px] text-[#86888C]">Minggu ini</span>
                            <MiniSparkline data={kpi.sparkline} color={kpi.color} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
