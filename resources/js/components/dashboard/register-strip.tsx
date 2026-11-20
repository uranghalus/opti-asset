import type { LucideIcon } from 'lucide-react';
import { Clock, MoveRight, ShieldAlert, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ActionButton } from './register-section';
import { num } from './register-types';
import type { Stats, WarrantyAlerts } from './register-types';

/**
 * Rekaan aksen KPI. Warna status hanya untuk makna semantik (LOCKED):
 * garansi kedaluwarsa = merah DSP, menunggu persetujuan = amber RPR,
 * agregat garansi jangka pendek = primary (teal).
 */
const ACCENT = {
    dsp: {
        iconWrap:
            'border-status-dsp-border bg-status-dsp-bg text-status-dsp-text',
        icon: 'text-status-dsp-text',
        value: 'text-status-dsp-text',
    },
    rpr: {
        iconWrap:
            'border-status-rpr-border bg-status-rpr-bg text-status-rpr-text',
        icon: 'text-status-rpr-text',
        value: 'text-foreground',
    },
    primary: {
        iconWrap:
            'border-primary-muted-border bg-primary-muted text-primary',
        icon: 'text-primary',
        value: 'text-foreground',
    },
} as const;

type AccentKey = keyof typeof ACCENT;

type KpiDef = {
    key: string;
    label: string;
    value: number;
    sub: string;
    href?: string | null;
    accent: AccentKey;
    icon: LucideIcon;
    tooltip: string;
};

/**
 * Strip empat KPI terkait pekerjaan: urutan = urgensi (garansi lewat dan
 * pengajuan menunggu ditempatkan paling awal). Semua angka berasal dari
 * props — tidak ada perkiraan/trend yang dikarang.
 *
 * Adaptasi: di mobile strip menjadi carousel horizontal scroll-snap
 * (edge-bleed, snap-mandatory) agar tiap kartu KPI tetap terbaca penuh;
 * dari sm menjadi grid 2 kolom, lg 4 kolom. Tombol "Kelola" disembunyikan
 * saat print (elemen interaktif).
 */
export function RegisterStrip({
    stats,
    warranty,
    hrefs,
}: {
    stats?: Stats | null;
    warranty?: WarrantyAlerts | null;
    hrefs?: {
        transfers?: string | null;
        disposals?: string | null;
        assets?: string | null;
    };
}) {
    const pendingTransfers = stats?.pending_transfers ?? 0;
    const pendingDisposals = stats?.pending_disposals ?? 0;
    const expired = warranty?.expired ?? 0;
    const expiring30 = warranty?.expiring_30 ?? 0;

    const kpis: KpiDef[] = [
        {
            key: 'pending-transfers',
            label: 'Mutasi Belum Disetujui',
            value: pendingTransfers,
            sub:
                pendingTransfers > 0
                    ? 'Menunggu persetujuan'
                    : 'Tidak ada pengajuan',
            href: hrefs?.transfers,
            accent: 'rpr',
            icon: MoveRight,
            tooltip: 'Pengajuan mutasi dengan status menunggu persetujuan.',
        },
        {
            key: 'pending-disposals',
            label: 'Penghapusan Belum Disetujui',
            value: pendingDisposals,
            sub:
                pendingDisposals > 0
                    ? 'Menunggu persetujuan'
                    : 'Tidak ada pengajuan',
            href: hrefs?.disposals,
            accent: 'rpr',
            icon: Trash2,
            tooltip: 'Pengajuan disposal dengan status menunggu persetujuan.',
        },
        {
            key: 'warranty-30',
            label: 'Garansi Akan Habis',
            value: expiring30,
            sub:
                expiring30 > 0
                    ? 'Termasuk yang sudah habis'
                    : 'Tidak ada dalam 30 hari',
            href: hrefs?.assets,
            accent: 'primary',
            icon: Clock,
            tooltip:
                'Aset dengan garansi berakhir dalam 30 hari ke depan, termasuk yang sudah habis.',
        },
    ];

    return (
        <div
            className={cn(
                // Mobile: carousel horizontal scroll-snap (kartar tetap
                // terbaca penuh, ada peek kartu berikutnya) — grid baru dari
                // sm (2 kolom) dan lg (4 kolom). Tidak ada overflow halaman:
                // scroll terkurung di container ini.
                '-mx-4 no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4',
            )}
        >
            {kpis.map((kpi) => {
                const zero = kpi.value === 0;
                const Icon = kpi.icon;
                const accent = ACCENT[kpi.accent];

                return (
                    <Card
                        key={kpi.key}
                        className={cn(
                            'min-w-[15.5rem] shrink-0 snap-center gap-3 rounded-lg border-border p-4 transition-[border-color] duration-200 sm:min-w-0',
                            'contrast-more:border-border-strong',
                            '[@media(hover:hover)]:hover:border-border-strong',
                            'print:break-inside-avoid',
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {kpi.label}
                                </p>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p
                                            aria-label={`${kpi.label}: ${num(kpi.value)}`}
                                            className={cn(
                                                'mt-2 w-fit text-3xl leading-none font-bold tracking-tight tabular-nums',
                                                zero
                                                    ? 'text-muted-foreground'
                                                    : accent.value,
                                            )}
                                        >
                                            {num(kpi.value)}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {kpi.tooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                                    accent.iconWrap,
                                    zero && 'opacity-60',
                                )}
                            >
                                <Icon
                                    className={cn('size-5', accent.icon)}
                                    strokeWidth={2}
                                />
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <p className="min-w-0 text-xs break-words text-muted-foreground">
                                {kpi.sub}
                            </p>

                            {kpi.href ? (
                                <ActionButton
                                    href={kpi.href}
                                    className="px-2.5 text-xs print:hidden"
                                >
                                    Kelola
                                </ActionButton>
                            ) : null}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}