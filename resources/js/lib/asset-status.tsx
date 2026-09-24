import {
    CircleCheck,
    Hammer,
    MoveRight,
    PackageOpen,
    Trash2,
} from 'lucide-react';
import { createElement } from 'react';
import { cn } from '@/lib/utils';

export type AssetStatusValue = 'ACT' | 'LOAN' | 'RPR' | 'MUT' | 'DSP';

export const ASSET_STATUSES: {
    value: AssetStatusValue;
    label: string;
    short: string;
    description: string;
}[] = [
    {
        value: 'ACT',
        label: 'Aktif',
        short: 'ACT',
        description: 'Tersedia dan digunakan dalam operasional normal.',
    },
    {
        value: 'LOAN',
        label: 'Dipinjamkan',
        short: 'LOAN',
        description: 'Dipinjam atau digunakan oleh unit/pengguna lain.',
    },
    {
        value: 'RPR',
        label: 'Dalam Perbaikan',
        short: 'RPR',
        description: 'Sedang diperbaiki dan tidak dapat digunakan.',
    },
    {
        value: 'MUT',
        label: 'Dimutasi',
        short: 'MUT',
        description: 'Sedang dalam proses perpindahan lokasi/unit.',
    },
    {
        value: 'DSP',
        label: 'Dihapus',
        short: 'DSP',
        description: 'Dihapus/dipensiunkan dan tidak dipakai lagi.',
    },
];

const STATUS_PRESENTATION: Record<
    AssetStatusValue,
    {
        icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
        chip: string;
        dot: string;
        solid: string;
    }
> = {
    /* Resep terkunci dari DESIGN.md §3.2 (Status Lock Rule). */
    ACT: {
        icon: CircleCheck,
        chip: 'bg-status-act-bg text-status-act-text ring-status-act-border',
        dot: 'bg-status-act-text',
        solid: '#166534',
    },
    LOAN: {
        icon: PackageOpen,
        chip: 'bg-status-loan-bg text-status-loan-text ring-status-loan-border',
        dot: 'bg-status-loan-text',
        solid: '#1e40af',
    },
    RPR: {
        icon: Hammer,
        chip: 'bg-status-rpr-bg text-status-rpr-text ring-status-rpr-border',
        dot: 'bg-status-rpr-text',
        solid: '#92400e',
    },
    MUT: {
        icon: MoveRight,
        chip: 'bg-status-mut-bg text-status-mut-text ring-status-mut-border',
        dot: 'bg-status-mut-text',
        solid: '#155e75',
    },
    DSP: {
        icon: Trash2,
        chip: 'bg-status-dsp-bg text-status-dsp-text ring-status-dsp-border',
        dot: 'bg-status-dsp-text',
        solid: '#9f1239',
    },
};

const NEUTRAL_CHIP =
    'bg-surface-sunken text-ink-muted ring-border-strong dark:bg-muted dark:text-muted-foreground dark:ring-border';

export function assetStatusLabel(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return (
        ASSET_STATUSES.find((status) => status.value === value)?.label ?? value
    );
}

export function assetStatusChip(value: string | null | undefined): string {
    if (!value) {
        return NEUTRAL_CHIP;
    }

    return STATUS_PRESENTATION[value as AssetStatusValue]?.chip ?? NEUTRAL_CHIP;
}

export function assetStatusDot(value: string | null | undefined): string {
    if (!value) {
        return 'bg-ink-subtle';
    }

    return (
        STATUS_PRESENTATION[value as AssetStatusValue]?.dot ?? 'bg-ink-subtle'
    );
}

export function assetStatusIcon(
    value: string | null | undefined,
): React.ComponentType<{ className?: string; strokeWidth?: number }> {
    if (!value) {
        return CircleCheck;
    }

    return STATUS_PRESENTATION[value as AssetStatusValue]?.icon ?? CircleCheck;
}

export function StatusBadge({
    value,
    withIcon = true,
    className,
}: {
    value: string | null | undefined;
    withIcon?: boolean;
    className?: string;
}) {
    const Icon = assetStatusIcon(value);
    const label = assetStatusLabel(value);

    /* Soft-rectangle 4px + label sans (DESIGN.md §7) — bukan kapsul,
       bukan stempel mono-kapsul; warna tidak pernah satu-satunya kanal. */
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
                assetStatusChip(value),
                className,
            )}
        >
            {withIcon
                ? createElement(Icon, {
                      className: 'size-3',
                      strokeWidth: 2.25,
                  })
                : null}
            {label}
        </span>
    );
}
