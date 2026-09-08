import { CircleCheck, Hammer, MoveRight } from 'lucide-react';

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
};

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

export function KpiCards({ stats }: { stats: Stats }) {
    const kpiData = [
        {
            label: 'Total Aset',
            value: stats.total_assets.toLocaleString('id-ID'),
            icon: CircleCheck,
            sparkline: [30, 35, 28, 42, 38, 50, 45, 55, 48, 62, 58, 65],
            color: '#FFB23E',
        },
        {
            label: 'Aktif',
            value: stats.asset_by_status.ACT.toLocaleString('id-ID'),
            icon: CircleCheck,
            sparkline: [20, 25, 22, 28, 25, 30, 28, 32, 30, 35, 33, 38],
            color: '#5EEAD4',
        },
        {
            label: 'Dalam Perbaikan',
            value: stats.asset_by_status.RPR.toLocaleString('id-ID'),
            icon: Hammer,
            sparkline: [5, 3, 4, 6, 8, 7, 9, 8, 10, 9, 11, 10],
            color: '#B892FF',
        },
        {
            label: 'Menunggu Mutasi',
            value: stats.pending_transfers.toLocaleString('id-ID'),
            icon: MoveRight,
            sparkline: [8, 10, 12, 9, 11, 13, 15, 14, 16, 18, 17, 20],
            color: '#FFB23E',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => {
                const Icon = kpi.icon;

                return (
                    <div
                        key={kpi.label}
                        className="group glass-panel relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span
                            className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
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
                                {kpi.value}
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
