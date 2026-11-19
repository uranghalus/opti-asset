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
                'flex flex-col items-center justify-center gap-4 py-20 text-center',
                !plain && 'mt-4 rounded-xl border border-dashed border-border',
            )}
        >
            {Icon && (
                <div
                    className={cn(
                        'flex size-16 items-center justify-center rounded-lg text-primary',
                        plain
                            ? 'bg-surface-sunken'
                            : 'border border-border bg-surface-sunken',
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
