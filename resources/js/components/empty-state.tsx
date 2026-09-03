import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    variant?: 'glass' | 'plain';
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    variant = 'glass',
}: EmptyStateProps) {
    const plain = variant === 'plain';

    return (
        <div
            className={cn(
                'card-enter flex flex-col items-center justify-center gap-4 py-20 text-center',
                !plain && 'glass-panel mt-4 delay-200',
            )}
        >
            {Icon && (
                <div
                    className={cn(
                        'flex size-16 items-center justify-center rounded-2xl text-primary',
                        plain
                            ? 'border border-white/20 bg-white/10'
                            : 'glass-card shadow-md',
                    )}
                >
                    <Icon className="size-7" strokeWidth={1.25} />
                </div>
            )}
            <div>
                <p className="text-base font-semibold text-foreground">
                    {title}
                </p>
                {description && (
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {(action || secondaryAction) && (
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                    {action}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
}
