import { CircleCheck, Hammer, MoveRight, Trash2 } from 'lucide-react';

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

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;

        return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;
    const areaD = `${pathD} L${width},${height} L0,${height} Z`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0"
        >
            <defs>
                <linearGradient
                    id={`spark-${color.replace('#', '')}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const KPIS = [
    {
        label: 'Total Aset',
        icon: CircleCheck,
        sparkline: [30, 35, 28, 42, 38, 50, 45, 55, 48, 62, 58, 65],
        color: '#FFB23E',
        getValue: (s: Stats) => s.total_assets,
    },
    {
        label: 'Aktif',
        icon: CircleCheck,
        sparkline: [20, 25, 22, 28, 25, 30, 28, 32, 30, 35, 33, 38],
        color: '#5EEAD4',
        getValue: (s: Stats) => s.asset_by_status.ACT,
    },
    {
        label: 'Perbaikan',
        icon: Hammer,
        sparkline: [5, 3, 4, 6, 8, 7, 9, 8, 10, 9, 11, 10],
        color: '#B892FF',
        getValue: (s: Stats) => s.asset_by_status.RPR,
    },
    {
        label: 'Menunggu Mutasi',
        icon: MoveRight,
        sparkline: [8, 10, 12, 9, 11, 13, 15, 14, 16, 18, 17, 20],
        color: '#FF9A3E',
        getValue: (s: Stats) => s.pending_transfers,
    },
    {
        label: 'Menunggu Disposal',
        icon: Trash2,
        sparkline: [3, 5, 4, 6, 5, 7, 8, 6, 9, 7, 10, 8],
        color: '#C52720',
        getValue: (s: Stats) => s.pending_disposals,
    },
];

export function KpiCards({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {KPIS.map((kpi) => {
                const Icon = kpi.icon;
                const value = kpi.getValue(stats);

                return (
                    <div
                        key={kpi.label}
                        className="group glass-panel relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#000C3D]/20"
                    >
                        <span
                            className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                            style={{ backgroundColor: kpi.color }}
                        />
                        <div className="flex items-start justify-between">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${kpi.color}15` }}
                            >
                                <Icon
                                    className="h-5 w-5"
                                    style={{ color: kpi.color }}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                {kpi.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                {value.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                            <span className="text-[10px] text-muted-foreground">
                                Terbaru
                            </span>
                            <MiniSparkline
                                data={kpi.sparkline}
                                color={kpi.color}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}