import {
    Boxes,
    Folder,
    FolderOpen,
    Library,
    Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassificationLevel } from '@/types/classification';

export const LEVEL_SHORT: Record<ClassificationLevel, string> = {
    group: 'Golongan',
    category: 'Kategori',
    cluster: 'Cluster',
    'sub-cluster': 'Sub Cluster',
};

export type LevelTint = {
    bg: string;
    fg: string;
    solid: string;
};

/* DESIGN.md v2.0: hierarki klasifikasi tidak memakai warna-warni
   (warna adalah bahasa status — P1). Level dibedakan oleh ikon
   + indentasi; chip memakai netral sunken yang tenang di kedua tema. */
export const LEVEL_TINTS: Record<ClassificationLevel, LevelTint> = {
    group: {
        bg: 'bg-surface-sunken dark:bg-muted',
        fg: 'text-ink-muted dark:text-muted-foreground',
        solid: '#5a6a7a',
    },
    category: {
        bg: 'bg-surface-sunken dark:bg-muted',
        fg: 'text-ink-muted dark:text-muted-foreground',
        solid: '#5a6a7a',
    },
    cluster: {
        bg: 'bg-surface-sunken dark:bg-muted',
        fg: 'text-ink-muted dark:text-muted-foreground',
        solid: '#5a6a7a',
    },
    'sub-cluster': {
        bg: 'bg-surface-sunken dark:bg-muted',
        fg: 'text-ink-muted dark:text-muted-foreground',
        solid: '#5a6a7a',
    },
};

const LEVEL_GLYPHS: Record<
    ClassificationLevel,
    React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
    group: Library,
    category: Folder,
    cluster: Boxes,
    'sub-cluster': Package,
};

export function LevelIcon({
    level,
    open = false,
    size = 'md',
}: {
    level: ClassificationLevel;
    open?: boolean;
    size?: 'md' | 'sm';
}) {
    const tint = LEVEL_TINTS[level];
    /* Kategori memakai pasangan buka/tutup; level lain ber-glifik tetap. */
    const Icon =
        level === 'category' ? (open ? FolderOpen : Folder) : LEVEL_GLYPHS[level];

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-md',
                size === 'md' ? 'size-7' : 'size-6',
                tint.bg,
            )}
        >
            <Icon
                className={cn(
                    'text-inherit',
                    size === 'md' ? 'size-4' : 'size-3.5',
                    tint.fg,
                )}
                strokeWidth={1.5}
            />
        </span>
    );
}
