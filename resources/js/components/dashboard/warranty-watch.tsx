import { AlertTriangle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Fragment } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { RegisterSection } from './register-section';
import { APPROVAL_STATUS, fullDate } from './register-types';
import type { WarrantyAsset, WarrantyAlerts } from './register-types';

const RECIPE = {
    dsp: APPROVAL_STATUS.rejected.vars,
    rpr: APPROVAL_STATUS.pending.vars,
    primary: {
        text: 'var(--primary)',
        bg: 'var(--primary-muted)',
        border: 'var(--primary-muted-border)',
    },
} as const;

type RecipeKey = keyof typeof RECIPE;

function DaysBadge({ days }: { days: number }) {
    let recipe: RecipeKey = 'primary';
    let text = '';

    if (days < 0) {
        recipe = 'dsp';
        text = `Kadaluarsa ${Math.abs(days)} hari lalu`;
    } else if (days === 0) {
        recipe = 'rpr';
        text = 'Berakhir hari ini';
    } else if (days <= 7) {
        recipe = 'dsp';
        text = `${days} hari lagi`;
    } else if (days <= 14) {
        recipe = 'rpr';
        text = `${days} hari lagi`;
    } else {
        text = `${days} hari lagi`;
    }

    const vars = RECIPE[recipe];
    const Icon = days <= 7 ? ShieldAlert : Clock;

    return (
        <Badge
            variant="outline"
            className="gap-1.5 font-medium whitespace-nowrap"
            style={{
                color: vars.text,
                backgroundColor: vars.bg,
                borderColor: vars.border,
            }}
        >
            <Icon className="size-3" strokeWidth={2} aria-hidden="true" />
            {text}
        </Badge>
    );
}

function AssetRow({ asset }: { asset: WarrantyAsset }) {
    const kode = asset.kode_asset ?? '—';
    const title = asset.brand
        ? `${asset.brand} ${asset.model ?? ''}`.trim()
        : 'Tanpa nama';

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-transparent px-1 py-2 transition-colors duration-150 print:break-inside-avoid [@media(hover:hover)]:hover:bg-accent">
            <div className="min-w-0 flex-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="block font-mono text-sm font-semibold break-words text-foreground @md:max-w-[11rem] @md:truncate">
                            {kode}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{kode}</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="mt-0.5 block text-xs break-words text-muted-foreground @md:max-w-[11rem] @md:truncate">
                            {title}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{title}</TooltipContent>
                </Tooltip>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
                <DaysBadge days={Math.round(asset.days_until ?? 0)} />
                <span className="text-[11px] text-muted-foreground">
                    Berakhir {fullDate(asset.warranty_expire)}
                </span>
            </div>
        </li>
    );
}

/**
 * Pemantau garansi: Alert untuk aset kedaluwarsa (butuh tindakan) dan
 * daftar aset yang garansinya berakhir ≤ 30 hari. Semua angka & tanggal
 * dari props. Status warna selalu ditemani ikon + teks.
 *
 * Adaptasi: kode & nama aset dibiarkan wrap di layar sentuh (truncate
 * hanya di kolom lebar), supaya informasi tetap terbaca tanpa hover.
 * ScrollArea tidak memotong daftar saat print; baris aman dipotong antar
 * halaman. Kartu ini muncul di kolom berbeda (full-width di tablet,
 * 1/3 kolom di desktop) — truncation memakai container query `@md:`.
 */
export function WarrantyWatch({
    alerts,
    className,
}: {
    alerts?: WarrantyAlerts | null;
    className?: string;
}) {
    const expired = alerts?.expired ?? 0;
    const soon = alerts?.expiring_soon ?? 0;
    const assets = (alerts?.assets ?? []).filter(Boolean);

    return (
        <RegisterSection
            title="Peringatan Garansi"
            description="Batas waktu garansi dalam 30 hari ke depan"
            icon={ShieldCheck}
            className={className}
            action={
                <div className="flex flex-wrap justify-end gap-1.5">
                    {expired > 0 ? (
                        <Badge
                            variant="outline"
                            className="gap-1.5 font-medium"
                            style={{
                                color: RECIPE.dsp.text,
                                backgroundColor: RECIPE.dsp.bg,
                                borderColor: RECIPE.dsp.border,
                            }}
                        >
                            <ShieldAlert
                                className="size-3"
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                            {expired} habis
                        </Badge>
                    ) : null}

                    {soon > 0 ? (
                        <Badge
                            variant="outline"
                            className="gap-1.5 font-medium"
                            style={{
                                color: RECIPE.rpr.text,
                                backgroundColor: RECIPE.rpr.bg,
                                borderColor: RECIPE.rpr.border,
                            }}
                        >
                            <Clock
                                className="size-3"
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                            {soon} segera habis
                        </Badge>
                    ) : null}
                </div>
            }
        >
            {expired > 0 ? (
                <Alert
                    className="mb-4 print:break-inside-avoid"
                    style={{
                        color: RECIPE.dsp.text,
                        backgroundColor: RECIPE.dsp.bg,
                        borderColor: RECIPE.dsp.border,
                    }}
                >
                    <AlertTriangle aria-hidden="true" />
                    <AlertTitle className="font-semibold">
                        {expired} aset garansi sudah habis
                    </AlertTitle>
                    <AlertDescription className="opacity-80">
                        Klaim garansi kemungkinan tidak lagi dapat diproses
                        pabrik. Periksa status garansi aset tersebut.
                    </AlertDescription>
                </Alert>
            ) : null}

            {assets.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <span
                        aria-hidden="true"
                        className="flex size-11 items-center justify-center rounded-full border border-status-act-border bg-status-act-bg text-status-act-text"
                    >
                        <ShieldCheck className="size-5" strokeWidth={2} />
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                        Semua garansi aktif
                    </p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        Tidak ada aset dengan garansi kedaluwarsa atau berakhir
                        dalam 30 hari ke depan.
                    </p>
                </div>
            ) : (
                <ScrollArea
                    className={
                        assets.length > 5
                            ? 'max-h-80 pe-1 print:max-h-none print:overflow-visible'
                            : 'print:max-h-none print:overflow-visible'
                    }
                >
                    <ul className="flex flex-col">
                        {assets.map((asset, index) => (
                            <Fragment key={asset.id}>
                                {index > 0 ? (
                                    <Separator className="my-1" />
                                ) : null}

                                <AssetRow asset={asset} />
                            </Fragment>
                        ))}
                    </ul>
                </ScrollArea>
            )}
        </RegisterSection>
    );
}
