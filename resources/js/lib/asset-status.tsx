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
    ACT: {
        icon: CircleCheck,
        chip: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        solid: 'bg-emerald-500',
    },
    LOAN: {
        icon: PackageOpen,
        chip: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
        dot: 'bg-sky-500',
        solid: 'bg-sky-500',
    },
    RPR: {
        icon: Hammer,
        chip: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
        dot: 'bg-amber-500',
        solid: 'bg-amber-500',
    },
    MUT: {
        icon: MoveRight,
        chip: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
        dot: 'bg-violet-500',
        solid: 'bg-violet-500',
    },
    DSP: {
        icon: Trash2,
        chip: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
        dot: 'bg-rose-500',
        solid: 'bg-rose-500',
    },
};

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
        return 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300';
    }

    return (
        STATUS_PRESENTATION[value as AssetStatusValue]?.chip ??
        'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300'
    );
}

export function assetStatusDot(value: string | null | undefined): string {
    if (!value) {
        return 'bg-slate-400';
    }

    return (
        STATUS_PRESENTATION[value as AssetStatusValue]?.dot ?? 'bg-slate-400'
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

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1',
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
