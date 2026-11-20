import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ActionButton } from './register-section';
import { num } from './register-types';
import type { Stats } from './register-types';

function integrityLevel(score: number): {
    label: string;
    /** Class utilitas penuh (harus literal agar ter-scan Tailwind). */
    bar: string;
} {
    if (score >= 80) {
        return {
            label: 'Baik',
            bar: '[&_[data-slot=progress-indicator]]:bg-success',
        };
    }

    if (score >= 50) {
        return {
            label: 'Perlu perhatian',
            bar: '[&_[data-slot=progress-indicator]]:bg-warning',
        };
    }

    return {
        label: 'Rendah',
        bar: '[&_[data-slot=progress-indicator]]:bg-destructive',
    };
}

/**
 * Masthead dashboard: kartu opaque (DESIGN.md — No-Glass Rule), total aset
 * sebagai angka hero teal, dan skor integritas klasifikasi sebagai Progress
 * berlabel. Angka hanya dari props.
 *
 * Adaptasi: tata letak satu kolom di mobile (judul → angka hero → panel
 * integritas → aksi), baris dari lg. Tombol aksi navigasi disembunyikan
 * saat print.
 */
export function RegisterMasthead({
    stats,
    integrityScore,
    tenantName,
    hrefs,
    className,
}: {
    stats?: Stats | null;
    integrityScore?: number | null;
    tenantName?: string | null;
    hrefs?: { assets?: string | null; transfers?: string | null };
    className?: string;
}) {
    const total = stats?.total_assets ?? 0;
    const score = Math.min(
        100,
        Math.max(
            0,
            Number.isFinite(integrityScore) ? (integrityScore ?? 0) : 0,
        ),
    );
    const level = integrityLevel(score);

    return (
        <Card
            className={cn(
                'gap-5 rounded-lg border-border p-5 sm:p-6 print:break-inside-avoid',
                className,
            )}
        >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                {/* Judul + hero */}
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Dashboard
                    </h1>
                    <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
                        Ringkasan kondisi aset, pengajuan menunggu, dan
                        peringatan garansi
                        {tenantName ? (
                            <>
                                {' '}
                                untuk{' '}
                                <span className="font-medium text-foreground">
                                    {tenantName}
                                </span>
                            </>
                        ) : null}
                        .
                    </p>

                    <div className="mt-5">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Total Aset
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p
                                    aria-label={`Total aset tercatat: ${num(total)}`}
                                    className="mt-1 w-fit text-4xl leading-none font-extrabold tracking-tight break-words text-primary tabular-nums sm:text-4xl lg:text-5xl"
                                >
                                    {num(total)}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                Jumlah seluruh aset tercatat dalam tenant ini.
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Integritas + aksi */}
                <div className="w-full shrink-0 lg:max-w-sm">
                    <div className="rounded-lg border border-border bg-surface-sunken p-4">
                        <div className="flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary-muted-border bg-primary-muted text-primary"
                            >
                                <ShieldCheck
                                    className="size-4.5"
                                    strokeWidth={2}
                                />
                            </span>

                            <div className="min-w-0 flex-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="w-fit text-sm font-semibold text-foreground">
                                            Integritas Klasifikasi
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        Persentase aset yang sudah memiliki
                                        klasifikasi (golongan) lengkap.
                                    </TooltipContent>
                                </Tooltip>
                                <p className="text-xs text-muted-foreground">
                                    Kelengkapan pengelompokan aset
                                </p>
                            </div>

                            <span
                                aria-label={`Skor integritas ${num(score)} persen — ${level.label}`}
                                className="text-2xl font-bold text-foreground tabular-nums"
                            >
                                {num(score)}
                                <span className="text-sm font-semibold text-muted-foreground">
                                    %
                                </span>
                            </span>
                        </div>

                        <Progress
                            value={score}
                            aria-label={`Integritas klasifikasi ${num(score)} persen`}
                            className={cn(
                                'mt-3 h-2.5 bg-muted [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:transition-[width] [&_[data-slot=progress-indicator]]:duration-200',
                                level.bar,
                            )}
                        />

                        <p className="mt-2 text-xs text-muted-foreground">
                            Status:{' '}
                            <span className="font-medium text-foreground">
                                {level.label}
                            </span>
                        </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                        <ActionButton href={hrefs?.assets} variant="default">
                            Kelola Aset
                        </ActionButton>

                        <ActionButton href={hrefs?.transfers} variant="outline">
                            Mutasi
                        </ActionButton>
                    </div>
                </div>
            </div>
        </Card>
    );
}