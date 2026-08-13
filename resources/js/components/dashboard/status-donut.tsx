import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

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
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#006FCF] uppercase">
                        Status
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Distribusi Aset
                    </h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-md px-2.5 text-[11px] font-medium text-[#86888C] hover:text-[#1A1A1A] dark:text-[#B7C3D9] dark:hover:text-white"
                >
                    Saat Ini
                </Button>
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
                        <span className="text-xl font-bold text-[#1A1A1A] dark:text-white">
                            {total}
                        </span>
                        <span className="text-[10px] text-[#86888C]">
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
                                <span className="flex items-center gap-2 text-sm text-[#1A1A1A] dark:text-white">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}
                                </span>
                                <span className="text-xs text-[#86888C] tabular-nums">
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
