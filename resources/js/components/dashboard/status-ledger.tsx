import { PieChart as PieIcon } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { RegisterSection } from './register-section';
import { num, pct, STATUS_META, STATUS_ORDER } from './register-types';
import type { AssetByStatus, Stats } from './register-types';

function statusEntries(status: AssetByStatus) {
    return STATUS_ORDER.map((key) => ({
        key,
        name: STATUS_META[key].label,
        value: Math.max(0, Number(status?.[key]) || 0),
        color: STATUS_META[key].vars.text,
    }));
}

/**
 * Donut distribusi status aset. Warna mengikuti resep status LOCKED
 * (DESIGN.md §Status — P1): hue semantik, tidak dipakai sebagai dekorasi,
 * dan setiap irisan selalu ditemani label + angka + persen. Total tampil
 * di tengah donut.
 *
 * Adaptasi: donut lebih kecil di mobile (h-40) dengan legenda di bawah
 * (bukan di samping); dari sm legena pindah ke samping donut. Angka &
 * persen selalu inline — tidak bergantung pada hover/tooltip.
 */
export function StatusLedger({
    stats,
    className,
}: {
    stats?: Stats | null;
    className?: string;
}) {
    const status = stats?.asset_by_status;
    const entries = statusEntries(
        status ?? { ACT: 0, LOAN: 0, RPR: 0, MUT: 0, DSP: 0 },
    ).filter((entry) => entry.value > 0);

    const total = entries.reduce((sum, entry) => sum + entry.value, 0);

    const config: ChartConfig = Object.fromEntries(
        STATUS_ORDER.map((key) => [
            key,
            {
                label: STATUS_META[key].label,
                color: STATUS_META[key].vars.text,
            },
        ]),
    );

    if (total === 0) {
        return (
            <RegisterSection
                title="Distribusi Status"
                description="Siklus hidup aset (ACT · LOAN · RPR · MUT · DSP)"
                icon={PieIcon}
                className={className}
            >
                <Empty className="min-h-48">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <PieIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle className="text-sm font-semibold">
                            Belum ada aset tercatat
                        </EmptyTitle>
                        <EmptyDescription className="text-xs">
                            Distribusi status muncul setelah aset pertama
                            ditambahkan ke tenant ini.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </RegisterSection>
        );
    }

    return (
        <RegisterSection
            title="Distribusi Status"
            description="Siklus hidup aset (ACT · LOAN · RPR · MUT · DSP)"
            icon={PieIcon}
            className={className}
        >
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                <div className="relative mx-auto h-40 w-40 shrink-0 sm:h-44 sm:w-44">
                    <ChartContainer
                        config={config}
                        className="aspect-auto h-full w-full"
                        role="img"
                        aria-label={`Donut distribusi status aset. Total ${num(total)} aset. ${entries
                            .map(
                                (entry) =>
                                    `${entry.name} ${num(entry.value)} (${pct(entry.value, total)} persen)`,
                            )
                            .join(', ')}`}
                    >
                        <PieChart>
                            <Pie
                                data={entries}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="62%"
                                outerRadius="100%"
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {entries.map((entry) => (
                                    <Cell key={entry.key} fill={entry.color} />
                                ))}
                            </Pie>

                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        hideIndicator
                                        formatter={(value, name) => (
                                            <div className="flex w-full items-center justify-between gap-3">
                                                <span className="text-muted-foreground">
                                                    {name}
                                                </span>
                                                <span className="font-mono font-medium text-foreground tabular-nums">
                                                    {num(Number(value) || 0)} ·{' '}
                                                    {pct(
                                                        Number(value) || 0,
                                                        total,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        )}
                                    />
                                }
                            />
                        </PieChart>
                    </ChartContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground tabular-nums">
                            {num(total)}
                        </span>
                        <span className="text-[12px] tracking-wide text-muted-foreground uppercase">
                            Aset
                        </span>
                    </div>
                </div>

                <ul className="flex w-full min-w-0 flex-1 flex-col gap-2">
                    {entries.map((entry) => (
                        <li
                            key={entry.key}
                            className="flex items-center gap-2.5 rounded-md px-1 py-1 text-sm transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent"
                        >
                            <span
                                aria-hidden="true"
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-foreground">
                                {entry.name}
                            </span>
                            <span className="text-xs font-semibold text-foreground tabular-nums">
                                {num(entry.value)}
                            </span>
                            <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                                {pct(entry.value, total)}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </RegisterSection>
    );
}
