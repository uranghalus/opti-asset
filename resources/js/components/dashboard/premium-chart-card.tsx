import type { ReactNode } from 'react';
import { useReveal } from '@/hooks/use-reveal';

type PremiumChartCardProps = {
    title: string;
    eyebrow?: string;
    children: ReactNode;
    className?: string;
    delay?: number;
};

export function PremiumChartCard({
    title,
    eyebrow,
    children,
    className = '',
    delay = 0,
}: PremiumChartCardProps) {
    const ref = useReveal();

    return (
        <div
            ref={ref}
            className={`reveal delay-${delay} bezel-outer ${className}`}
        >
            <div className="bezel-inner p-6">
                <div className="mb-5">
                    {eyebrow && (
                        <p className="mb-1.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                            {eyebrow}
                        </p>
                    )}
                    <h3 className="text-lg font-semibold tracking-tight">
                        {title}
                    </h3>
                </div>
                {children}
            </div>
        </div>
    );
}
