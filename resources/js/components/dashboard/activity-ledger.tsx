import { History, MoveRight, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { RegisterSection } from './register-section';
import { APPROVAL_STATUS, fullDate, relTime } from './register-types';
import type { RecentDisposal, RecentTransfer } from './register-types';

type FeedItem = {
    id: string;
    kind: 'mutasi' | 'disposal';
    assetKode: string;
    detail: string;
    status: string;
    date: string;
};

const KIND_META = {
    mutasi: {
        label: 'Mutasi',
        action: 'Mutasi diajukan',
        icon: MoveRight,
        wrap: 'border-primary-muted-border bg-primary-muted text-primary',
    },
    disposal: {
        label: 'Disposal',
        action: 'Disposal diajukan',
        icon: Trash2,
        wrap: 'border-status-dsp-border bg-status-dsp-bg text-status-dsp-text',
    },
} as const;

function StatusBadge({ status }: { status: string }) {
    const meta = APPROVAL_STATUS[status];

    if (!meta) {
        return (
            <Badge variant="outline" className="font-medium">
                {status || '—'}
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="gap-1.5 font-medium"
            style={{
                color: meta.vars.text,
                backgroundColor: meta.vars.bg,
                borderColor: meta.vars.border,
            }}
        >
            {meta.label}
        </Badge>
    );
}

/**
 * Feed aktivitas terbaru (mutasi & disposal) sebagai timeline: ikon + Badge
 * status per jenis, garis vertikal penghubung, dan waktu relatif (tanggal
 * penuh via Tooltip). Tab beralih antara Mutasi / Disposal / Semua.
 *
 * Adaptasi: tab melebar penuh dengan tinggi sentuh ≥44px di mobile
 * (min-h-[3.25rem] agar trigger-nya cukup besar); dari sm kembali ringkas
 * di kanan. Kode aset & detail dibiarkan wrap di layar sentuh (informasi
 * tetap terbaca tanpa hover), truncate hanya di kolom lebar. Tab list
 * disembunyikan saat print; tiap baris feed aman dipotong antar halaman.
 */
export function ActivityLedger({
    transfers,
    disposals,
    className,
}: {
    transfers?: RecentTransfer[] | null;
    disposals?: RecentDisposal[] | null;
    className?: string;
}) {
    const [tab, setTab] = useState<'all' | 'mutasi' | 'disposal'>('all');

    const items = useMemo<FeedItem[]>(() => {
        const merged: FeedItem[] = [
            ...(transfers ?? []).map((item) => ({
                id: `mutasi-${item.id}`,
                kind: 'mutasi' as const,
                assetKode: item.asset_kode ?? '—',
                detail: `${item.from ?? '—'} → ${item.to ?? '—'}`,
                status: item.status ?? '',
                date: item.date,
            })),
            ...(disposals ?? []).map((item) => ({
                id: `disposal-${item.id}`,
                kind: 'disposal' as const,
                assetKode: item.asset_kode ?? '—',
                detail: item.reason ?? '—',
                status: item.status ?? '',
                date: item.date,
            })),
        ];

        return merged
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5);
    }, [transfers, disposals]);

    const visible =
        tab === 'all' ? items : items.filter((item) => item.kind === tab);

    return (
        <RegisterSection
            title="Aktivitas Terbaru"
            description="Audit trail — apa yang berubah dan kapan"
            icon={History}
            className={className}
        >
            <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as typeof tab)}
                className="flex flex-col gap-4"
            >
                <TabsList
                    variant="line"
                    className="min-h-[3.25rem] w-full sm:w-auto sm:self-end print:hidden"
                >
                    <TabsTrigger value="all" className="px-2.5 text-xs">
                        Semua
                    </TabsTrigger>
                    <TabsTrigger value="mutasi" className="px-2.5 text-xs">
                        Mutasi
                    </TabsTrigger>
                    <TabsTrigger value="disposal" className="px-2.5 text-xs">
                        Disposal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    <Feed items={visible} />
                </TabsContent>
                <TabsContent value="mutasi" className="mt-0">
                    <Feed items={visible} />
                </TabsContent>
                <TabsContent value="disposal" className="mt-0">
                    <Feed items={visible} />
                </TabsContent>
            </Tabs>
        </RegisterSection>
    );
}

function Feed({ items }: { items: FeedItem[] }) {
    if (items.length === 0) {
        return (
            <Empty className="min-h-44">
                <EmptyDescription className="text-xs">
                    Belum ada aktivitas pada kategori ini.
                </EmptyDescription>
            </Empty>
        );
    }

    return (
        <ol className="relative flex flex-col gap-4">
            <span
                aria-hidden="true"
                className="absolute top-2 bottom-2 left-[15px] w-px bg-border"
            />

            {items.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;

                return (
                    <li
                        key={item.id}
                        className="group relative flex items-start gap-3 print:break-inside-avoid"
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card',
                                meta.wrap,
                            )}
                        >
                            <Icon className="size-4" strokeWidth={2} />
                        </span>

                        <div className="min-w-0 flex-1 rounded-lg border border-transparent px-1 py-0.5 transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="font-mono text-sm font-semibold break-words text-foreground @2xl:max-w-[12rem] @2xl:truncate">
                                            {item.assetKode}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {item.assetKode}
                                    </TooltipContent>
                                </Tooltip>

                                <span className="text-xs text-muted-foreground">
                                    {meta.action}
                                </span>

                                <StatusBadge status={item.status} />
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="block break-words @2xl:max-w-[22rem] @2xl:truncate">
                                            {item.detail}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {item.detail}
                                    </TooltipContent>
                                </Tooltip>
                            </p>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="mt-1 block w-fit text-[11px] text-muted-foreground">
                                        {relTime(item.date)}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {fullDate(item.date)}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
