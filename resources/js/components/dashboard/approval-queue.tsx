import { router } from '@inertiajs/react';
import { Check, CircleCheck, MoveRight, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';
import {
    approve as approveTransferRoute,
    reject as rejectTransferRoute,
} from '@/routes/tenant/asset-transfers';
import {
    approve as approveDisposalRoute,
    reject as rejectDisposalRoute,
} from '@/routes/tenant/disposals';
import { ActionButton, RegisterSection } from './register-section';
import { fullDate } from './register-types';
import type { RecentDisposal, RecentTransfer } from './register-types';

type QueueItem = {
    id: string;
    rawId: string;
    kind: 'mutasi' | 'disposal';
    assetKode: string;
    detail: string;
    date: string;
};

const KIND_META = {
    mutasi: { label: 'Mutasi', icon: MoveRight },
    disposal: { label: 'Disposal', icon: Trash2 },
} as const;

function TypeBadge({ kind }: { kind: QueueItem['kind'] }) {
    const meta = KIND_META[kind];
    const Icon = meta.icon;

    return (
        <Badge
            variant="outline"
            className="gap-1.5 font-medium"
            style={{
                color: `var(${
                    kind === 'mutasi'
                        ? '--primary'
                        : '--status-dsp-text'
                })`,
                backgroundColor: `var(${
                    kind === 'mutasi'
                        ? '--primary-muted'
                        : '--status-dsp-bg'
                })`,
                borderColor: `var(${
                    kind === 'mutasi'
                        ? '--primary-muted-border'
                        : '--status-dsp-border'
                })`,
            }}
        >
            <Icon className="size-3" strokeWidth={2} aria-hidden="true" />
            {meta.label}
        </Badge>
    );
}

/**
 * Template kolom baris antrean: mobile = kartu bertumpuk (flex-wrap),
 * desktop = baris tabel (grid). Satu markup untuk kedua konteks — tanpa
 * duplikasi DOM yang disembunyikan CSS.
 */
const QUEUE_COLS =
    'md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,2.2fr)_auto_auto]';

/**
 * Antrean persetujuan: pengajuan mutasi & disposal berstatus `pending`
 * (nilai enum backend — bukan label). Aksi setujui/tolak terhubung ke
 * route Wayfinder; saat tenant null atau pengguna tanpa izin, tombol
 * dinonaktifkan dengan penjelasan (Tooltip), tidak diam-diam hilang.
 *
 * Adaptasi: mobile menampilkan daftar Card ringkas per pengajuan (aset +
 * jenis di baris pertama, detail & tanggal di baris detail, aksi penuh
 * lebar dengan target sentuh ≥44px); desktop menjadi baris tabel
 * berkolom. Alasan tombol nonaktif tampil inline di sentuh karena Tooltip
 * tak bisa di-hover di sana. Header kolom & tautan navigasi disembunyikan
 * print; baris aman dipotong antar halaman.
 */
export function ApprovalQueue({
    transfers,
    disposals,
    tenantCode,
    hrefs,
    className,
}: {
    transfers?: RecentTransfer[] | null;
    disposals?: RecentDisposal[] | null;
    tenantCode?: string | null;
    hrefs?: { transfers?: string | null; disposals?: string | null };
    className?: string;
}) {
    const { can } = useCan();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const items: QueueItem[] = [
        ...(transfers ?? [])
            .filter((item) => item.status === 'pending')
            .map((item) => ({
                id: `mutasi-${item.id}`,
                rawId: String(item.id),
                kind: 'mutasi' as const,
                assetKode: item.asset_kode ?? '—',
                detail: `${item.from ?? '—'} → ${item.to ?? '—'}`,
                date: item.date,
            })),
        ...(disposals ?? [])
            .filter((item) => item.status === 'pending')
            .map((item) => ({
                id: `disposal-${item.id}`,
                rawId: String(item.id),
                kind: 'disposal' as const,
                assetKode: item.asset_kode ?? '—',
                detail: item.reason ?? '—',
                date: item.date,
            })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const canApprove = (kind: QueueItem['kind']): boolean =>
        kind === 'mutasi'
            ? can('asset.transfer.edit')
            : can('asset.disposal.edit');

    const act = (item: QueueItem, action: 'approve' | 'reject') => {
        if (!tenantCode) {
            return;
        }

        const url =
            item.kind === 'mutasi'
                ? (action === 'approve'
                      ? approveTransferRoute
                      : rejectTransferRoute)({
                      tenant: tenantCode,
                      assetTransfer: item.rawId,
                  }).url
                : (action === 'approve'
                      ? approveDisposalRoute
                      : rejectDisposalRoute)({
                      tenant: tenantCode,
                      disposal: item.rawId,
                  }).url;

        setProcessingId(item.id);

        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        action === 'approve'
                            ? 'Pengajuan disetujui.'
                            : 'Pengajuan ditolak.',
                    ),
                onError: () =>
                    toast.error('Status pengajuan gagal diperbarui.'),
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const ActionCell = ({ item }: { item: QueueItem }) => {
        const allowed = canApprove(item.kind);
        const blockedByTenant = !tenantCode;
        const busy = processingId === item.id;
        const reason = blockedByTenant
            ? 'Pilih tenant aktif untuk memproses pengajuan.'
            : 'Anda tidak memiliki izin untuk pengajuan ini.';

        const buttons = (
            <>
                <Button
                    size="sm"
                    variant="default"
                    className="flex-1 gap-1.5 px-3 text-sm md:flex-none md:text-xs"
                    disabled={!allowed || blockedByTenant || busy}
                    aria-busy={busy}
                    onClick={() => act(item, 'approve')}
                >
                    <Check className="size-3.5" aria-hidden="true" />
                    Setujui
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 px-3 text-sm md:flex-none md:text-xs"
                    disabled={!allowed || blockedByTenant || busy}
                    aria-busy={busy}
                    onClick={() => act(item, 'reject')}
                >
                    <X className="size-3.5" aria-hidden="true" />
                    Tolak
                </Button>
            </>
        );

        if (blockedByTenant || !allowed) {
            return (
                <div className="flex w-full flex-col gap-1 md:w-auto md:items-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex w-full gap-2 md:w-auto">
                                {buttons}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{reason}</TooltipContent>
                    </Tooltip>

                    {/* Tooltip tak bisa di-hover di layar sentuh. */}
                    <span className="text-[12px] text-muted-foreground md:hidden">
                        {reason}
                    </span>
                </div>
            );
        }

        return (
            <div className="flex w-full gap-2 md:w-auto md:justify-self-end">
                {buttons}
            </div>
        );
    };

    return (
        <RegisterSection
            title="Menunggu Persetujuan"
            description="Pengajuan mutasi & disposal yang perlu diproses"
            icon={CircleCheck}
            className={className}
            action={
                <div className="flex gap-1.5 print:hidden">
                    <ActionButton href={hrefs?.transfers}>Mutasi</ActionButton>
                    <ActionButton href={hrefs?.disposals}>
                        Disposal
                    </ActionButton>
                </div>
            }
        >
            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <span
                        aria-hidden="true"
                        className="flex size-11 items-center justify-center rounded-full border border-status-act-border bg-status-act-bg text-status-act-text"
                    >
                        <Check className="size-5" strokeWidth={2} />
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                        Tidak ada pengajuan menunggu
                    </p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        Semua pengajuan mutasi dan disposal sudah diproses.
                    </p>
                    <ActionButton
                        href={hrefs?.transfers}
                        variant="outline"
                        className="print:hidden"
                    >
                        Lihat riwayat mutasi
                    </ActionButton>
                </div>
            ) : (
                <>
                    {/* Header kolom — hanya tampil pada layout tabel desktop. */}
                    <div
                        aria-hidden="true"
                        className={cn(
                            'hidden pb-2 text-xs font-medium text-muted-foreground md:grid md:items-center md:gap-3 md:px-2',
                            QUEUE_COLS,
                        )}
                    >
                        <span>Aset</span>
                        <span>Jenis</span>
                        <span>Detail</span>
                        <span className="whitespace-nowrap">Tanggal</span>
                        <span className="text-right">Aksi</span>
                    </div>

                    <ul className="flex flex-col gap-3 md:gap-0">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className={cn(
                                    'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card p-3',
                                    'md:grid md:items-center md:gap-3 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-2 md:py-3',
                                    QUEUE_COLS,
                                    'transition-colors duration-150 print:break-inside-avoid [@media(hover:hover)]:hover:bg-accent',
                                )}
                            >
                                <span className="font-mono text-sm font-semibold text-foreground">
                                    {item.assetKode}
                                </span>

                                <TypeBadge kind={item.kind} />

                                <p className="min-w-0 basis-full text-sm break-words text-muted-foreground md:basis-auto @2xl:truncate">
                                    {item.detail}
                                </p>

                                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                                    {fullDate(item.date)}
                                </span>

                                <ActionCell item={item} />
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </RegisterSection>
    );
}
