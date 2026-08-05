import { Folder, FolderOpen } from 'lucide-react';
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

export const LEVEL_TINTS: Record<ClassificationLevel, LevelTint> = {
    group: {
        bg: 'bg-[rgba(0,111,207,0.10)] dark:bg-[rgba(90,169,236,0.16)]',
        fg: 'text-[#006FCF] dark:text-[#5AA9EC]',
        solid: '#006FCF',
    },
    category: {
        bg: 'bg-[rgba(0,135,90,0.10)] dark:bg-[rgba(47,211,160,0.14)]',
        fg: 'text-[#00875A] dark:text-[#3ED6A5]',
        solid: '#00875A',
    },
    cluster: {
        bg: 'bg-[rgba(185,80,0,0.10)] dark:bg-[rgba(224,137,79,0.16)]',
        fg: 'text-[#B95000] dark:text-[#E0894F]',
        solid: '#B95000',
    },
    'sub-cluster': {
        bg: 'bg-[rgba(0,23,90,0.08)] dark:bg-[rgba(157,181,232,0.14)]',
        fg: 'text-[#00175A] dark:text-[#9DB5E8]',
        solid: '#00175A',
    },
};

export function LevelIcon({
    level,
    open = false,
    size = 'md',
}: {
    level: ClassificationLevel;
    open?: boolean;
    size?: 'sm' | 'md';
}) {
    const tint = LEVEL_TINTS[level];
    const Icon = open ? FolderOpen : Folder;

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-lg',
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
