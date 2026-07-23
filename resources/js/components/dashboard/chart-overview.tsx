import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';

const data = [
    { period: 'L1', value: 42 },
    { period: 'L2', value: 38 },
    { period: 'L3', value: 55 },
    { period: 'L4', value: 47 },
    { period: 'L5', value: 63 },
    { period: 'L6', value: 58 },
    { period: 'L7', value: 71 },
];

const periods = ['7 Hari', '30 Hari', '90 Hari'];

export function ChartOverview() {
    const [activePeriod, setActivePeriod] = useState('7 Hari');

    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#006FCF]">
                        Overview
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Akuisisi Aset
                    </h3>
                </div>
                <div className="flex gap-1 rounded-lg border border-[#D5D9DC] bg-[#F7F8F9] p-0.5 dark:border-[#1e293b] dark:bg-white/[0.04]">
                    {periods.map((p) => (
                        <Button
                            key={p}
                            variant="ghost"
                            size="sm"
                            className={`h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors ${activePeriod === p
                                    ? 'bg-white text-[#1A1A1A] shadow-sm dark:bg-white/[0.08] dark:text-white'
                                    : 'text-[#86888C] hover:text-[#1A1A1A] dark:text-[#B7C3D9] dark:hover:text-white'
                                }`}
                            onClick={() => setActivePeriod(p)}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#006FCF" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#006FCF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEDEE" />
                        <XAxis
                            dataKey="period"
                            stroke="#86888C"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#86888C"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #D5D9DC',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#006FCF"
                            strokeWidth={2}
                            fill="url(#chartGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
