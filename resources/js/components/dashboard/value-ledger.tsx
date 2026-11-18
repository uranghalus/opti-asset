import { Coins } from 'lucide-react';
import { Fragment } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { RegisterSection } from './register-section';
import { num, rp, rpCompact, toNumber } from './register-types';
import type { AssetTypeSlice } from './register-types';

/** Warna per tipe aset mengikuti peta tipe DESIGN.md (teal / slate / muted). */
const TYPE_COLOR: Record<string, string> = {
    fixed_asset: 'var(--tipe-aktiva-text)',
    equipment: 'var(--tipe-peralatan-text)',
    unclassified: 'var(--muted-foreground)',
};

/** Label kategori dipendekkan di layar sempit agar sumbu tetap terbaca. */
function truncateLabel(value: string, max: number): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Bar horizontal nilai perolehan per tipe aset (FR-13.8). Nilai di-label
 * ringkas di sumbu; tooltip menampilkan rupiah penuh. Tidak ada angka
 * yang tidak berasal dari props.
 *
 * Adaptasi: tinggi chart lebih ringkas di mobile dan lebar sumbu kategori
 * dikurangi (label dipendekkan) supaya bar tetap terbaca di 320px; daftar
 * rincian di bawah chart memuat nilai penuh — informasi tidak pernah
 * bergantung pada hover. Tabel rincian aman dipotong antar halaman print.
 */
export function ValueLedger({
    slices,
    className,
}: {
    slices?: AssetTypeSlice[] | null;
    className?: string;
}) {
    const safe = (slices ?? []).filter(
        (slice): slice is AssetTypeSlice => !!slice && !!slice.label,
    );

    const isMobile = useIsMobile();

    const rows = safe.map((slice) => ({
        label: slice.label,
        count: Math.max(0, Number(slice.count) || 0),
        value: toNumber(slice.value),
        bookValue: toNumber(slice.book_value),
        color: TYPE_COLOR[slice.type] ?? 'var(--chart-5)',
    }));

    const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
    const config: ChartConfig = Object.fromEntries(
        rows.map((row) => [row.label, { label: row.label, color: row.color }]),
    );

    return (
        <RegisterSection
            title="Nilai Aset per Tipe"
            description="Total nilai perolehan dan nilai buku (FR-13.8)"
            icon={Coins}
            className={className}
        >
            {rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada aset terkategori tipe.
                </p>
            ) : (
                <div className="flex flex-col gap-5">
                    {totalValue > 0 ? (
                        <ChartContainer
                            config={config}
                            className="aspect-auto h-40 w-full sm:h-44"
                            role="img"
                            aria-label={`Bar nilai perolehan per tipe aset. ${rows
                                .map((row) => `${row.label} ${rp(row.value)}`)
                                .join(', ')}`}
                        >
                            <BarChart
                                data={rows}
                                layout="vertical"
                                margin={{
                                    left: 4,
                                    right: 12,
                                    top: 4,
                                    bottom: 4,
                                }}
                                barCategoryGap="28%"
                            >
                                <CartesianGrid
                                    horizontal={false}
                                    className="stroke-border"
                                />

                                <XAxis
                                    type="number"
                                    tickFormatter={(value: number) =>
                                        rpCompact(value)
                                    }
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />

                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={4}
                                    width={isMobile ? 56 : 96}
                                    tickFormatter={(value: string) =>
                                        truncateLabel(
                                            String(value),
                                            isMobile ? 8 : 18,
                                        )
                                    }
                                    className="text-xs"
                                />

                                <Bar
                                    dataKey="value"
                                    radius={[0, 6, 6, 0]}
                                    barSize={22}
                                    isAnimationActive={false}
                                >
                                    {rows.map((row) => (
                                        <Cell
                                            key={row.label}
                                            fill={row.color}
                                        />
                                    ))}
                                </Bar>

                                <ChartTooltip
                                    cursor={{ fill: 'var(--muted)' }}
                                    content={
                                        <ChartTooltipContent
                                            hideIndicator
                                            formatter={(value) => (
                                                <div className="flex w-full items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">
                                                        Nilai perolehan
                                                    </span>
                                                    <span className="font-mono font-medium text-foreground tabular-nums">
                                                        {rp(Number(value) || 0)}
                                                    </span>
                                                </div>
                                            )}
                                            labelFormatter={(label) =>
                                                String(label)
                                            }
                                        />
                                    }
                                />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="py-2 text-sm text-muted-foreground">
                            Nilai perolehan belum diisi untuk aset tercatat.
                        </p>
                    )}

                    <ul className="flex flex-col">
                        {rows.map((row, index) => (
                            <Fragment key={row.label}>
                                {index > 0 ? (
                                    <Separator className="my-1" />
                                ) : null}

                                <li className="flex items-center justify-between gap-3 py-2.5 print:break-inside-avoid">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span
                                            aria-hidden="true"
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: row.color,
                                            }}
                                        />
                                        <span className="text-sm font-medium break-words text-foreground @md:truncate">
                                            {row.label}
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                            {num(row.count)} unit
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                                            {rp(row.value)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Nilai buku {rp(row.bookValue)}
                                        </p>
                                    </div>
                                </li>
                            </Fragment>
                        ))}
                    </ul>
                </div>
            )}
        </RegisterSection>
    );
}
