import { BarChart3 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { num } from './register-types';

export type RankedItem = {
    label: string;
    value: number;
    /** Keterangan tambahan (mis. tipe aset) — opsional. */
    meta?: string | null;
};

/** Siklus warna token chart (teal → cyan → amber → blue → slate). */
const DEFAULT_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

type RankedListProps = {
    items?: RankedItem[] | null;
    /** Maksimum baris tampil; sisanya diringkas sebagai "+N lainnya". */
    limit?: number;
    /**
     * Maksimum baris di layar sentuh. Sisanya tidak hilang: terbuka lewat
     * Sheet "Lihat semua" (drawer bawah) — memenuhi target 44px tanpa
     * membuat kartu peringkat terlalu panjang di ponsel.
     */
    mobileLimit?: number;
    /** Satuan di belakang angka (mis. "aset"). */
    unit?: string;
    colors?: string[];
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: React.ReactNode;
    /** Judul Sheet daftar lengkap (mobile). */
    allTitle?: string;
    /** Deskripsi Sheet daftar lengkap (mobile). */
    allDescription?: string;
    className?: string;
};

/**
 * Daftar peringkat: nomor urut, nama panjang di-truncate + Tooltip (hanya
 * saat kolom sempit; di layar sentuh label dibiarkan wrap agar tetap
 * terbaca), bar proporsional berwarna, dan angka tabular-nums. Semua nilai
 * sudah dikontrol pemanggil — daftar kosong merender empty state informatif.
 *
 * Adaptasi: mobile menampilkan `mobileLimit` baris + tombol "Lihat semua"
 * yang membuka Sheet berisi daftar penuh (markup baris yang sama, tanpa
 * duplikasi logika). Truncation label mengikuti lebar container Card
 * (`@md:`/`@2xl:`) karena kartu ini muncul di lebar kolom berbeda.
 */
export function RankedList({
    items,
    limit = 8,
    mobileLimit = 5,
    unit = 'aset',
    colors = DEFAULT_COLORS,
    emptyTitle = 'Belum ada data',
    emptyDescription = 'Data akan muncul di sini setelah aset tercatat.',
    emptyAction,
    allTitle = 'Daftar Lengkap',
    allDescription = 'Semua item berdasarkan jumlah aset terbanyak.',
    className,
}: RankedListProps) {
    const isMobile = useIsMobile();
    const [allOpen, setAllOpen] = useState(false);

    const safeItems = (items ?? []).filter(
        (item): item is RankedItem =>
            !!item && typeof item.label === 'string' && item.label.length > 0,
    );
    const sorted = [...safeItems].sort((a, b) => b.value - a.value);
    const max = Math.max(...sorted.map((item) => item.value ?? 0), 0);
    const visibleLimit = isMobile ? Math.min(limit, mobileLimit) : limit;
    const visible = sorted.slice(0, visibleLimit);
    const hidden = sorted.length - visible.length;

    const renderRows = (list: RankedItem[]) => (
        <ul className="flex flex-col gap-3">
            {list.map((item, index) => {
                const ratio =
                    max > 0 ? Math.round((item.value / max) * 100) : 0;
                const color = colors[index % colors.length];

                return (
                    <li
                        key={`${item.label}-${index}`}
                        className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
                    >
                        <span
                            aria-hidden="true"
                            className="text-right text-xs font-semibold text-muted-foreground tabular-nums"
                        >
                            {index + 1}
                        </span>

                        <div className="min-w-0">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="block text-sm font-medium break-words text-foreground @md:truncate">
                                        {item.label}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {item.label}
                                    {item.meta ? ` · ${item.meta}` : ''}
                                </TooltipContent>
                            </Tooltip>

                            <Progress
                                value={ratio}
                                aria-label={`Proporsi ${item.label}`}
                                className="mt-1.5 h-2 bg-muted [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-(--rank-color)"
                                style={
                                    {
                                        '--rank-color': color,
                                    } as React.CSSProperties
                                }
                            />
                        </div>

                        <div className="text-right">
                            <span className="block text-sm font-semibold text-foreground tabular-nums">
                                {num(item.value)}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                                {unit}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );

    if (visible.length === 0) {
        return (
            <Empty className={cn('min-h-40', className)}>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BarChart3 aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm font-semibold">
                        {emptyTitle}
                    </EmptyTitle>
                    <EmptyDescription className="text-xs">
                        {emptyDescription}
                    </EmptyDescription>
                </EmptyHeader>

                {emptyAction ? (
                    <EmptyContent>{emptyAction}</EmptyContent>
                ) : null}
            </Empty>
        );
    }

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <ScrollArea
                className={cn(
                    'w-full print:max-h-none print:overflow-visible',
                    visible.length > 6 && 'max-h-80 pe-1',
                )}
            >
                {renderRows(visible)}
            </ScrollArea>

            {hidden > 0 ? (
                isMobile ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-haspopup="dialog"
                            className="w-full print:hidden"
                            onClick={() => setAllOpen(true)}
                        >
                            Lihat semua ({num(sorted.length)})
                        </Button>

                        <Sheet open={allOpen} onOpenChange={setAllOpen}>
                            <SheetContent
                                side="bottom"
                                className="max-h-[85dvh] rounded-t-lg pb-[max(1rem,env(safe-area-inset-bottom))]"
                            >
                                <SheetHeader>
                                    <SheetTitle>{allTitle}</SheetTitle>
                                    <SheetDescription>
                                        {allDescription}
                                    </SheetDescription>
                                </SheetHeader>

                                <ScrollArea className="max-h-[60dvh] pe-1 print:max-h-none print:overflow-visible">
                                    {renderRows(sorted)}
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        +{num(hidden)} {unit} lainnya tidak ditampilkan.
                    </p>
                )
            ) : null}
        </div>
    );
}
