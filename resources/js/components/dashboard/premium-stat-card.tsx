import type { ReactNode } from 'react';
import { useReveal } from '@/hooks/use-reveal';

type PremiumStatCardProps = {
    label: string;
    value: string;
    change?: string;
    changePositive?: boolean;
    icon: ReactNode;
    delay?: number;
};

export function PremiumStatCard({
    label,
    value,
    change,
    changePositive = true,
    icon,
    delay = 0,
}: PremiumStatCardProps) {
    const ref = useReveal();

    return (
        <div ref={ref} className={`reveal delay-${delay} bezel-outer`}>
            <div className="flex items-center gap-4 p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {label}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight whitespace-nowrap">
                        {value}
                    </p>
                    {change && (
                        <p
                            className={`mt-0.5 text-xs font-medium ${changePositive ? 'text-[#00875A]' : 'text-[#C52720]'}`}
                        >
                            {change}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
