import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

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

const STATUS_COLORS: Record<string, string> = {
    ACT: '#00875A',
    LOAN: '#006FCF',
    RPR: '#B95000',
    MUT: '#7C3AED',
    DSP: '#C52720',
};

const STATUS_LABELS: Record<string, string> = {
    ACT: 'Aktif',
    LOAN: 'Dipinjamkan',
    RPR: 'Dalam Perbaikan',
    MUT: 'Dimutasi',
    DSP: 'Dihapus',
};

export function StatusDonut({ stats }: { stats: Stats }) {
    const data = Object.entries(stats.asset_by_status)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
            name: STATUS_LABELS[key] ?? key,
            value,
            color: STATUS_COLORS[key] ?? '#86888C',
        }));

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-[10px] font-semibold tracking-widest text-[#006FCF] uppercase">
                    FR-10.2
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                    Distribusi Aset
                </h3>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative size-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={60}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                strokeWidth={0}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-white">
                            {total}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                            Total
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                    {data.map((item) => {
                        const pct =
                            total > 0
                                ? ((item.value / total) * 100).toFixed(1)
                                : '0';

                        return (
                            <div
                                key={item.name}
                                className="flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2 text-sm text-white/90">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}
                                </span>
                                <span className="text-xs text-[#94A3B8] tabular-nums">
                                    {item.value} ({pct}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
