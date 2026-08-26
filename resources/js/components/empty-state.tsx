import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
            {Icon && (
                <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                    <Icon className="size-7" strokeWidth={1.25} />
                </div>
            )}
            <div>
                <p className="text-base font-semibold text-foreground">{title}</p>
                {description && (
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
