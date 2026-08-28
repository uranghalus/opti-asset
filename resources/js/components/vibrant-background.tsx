import type { HTMLAttributes } from 'react';

type VibrantVariant = 'default' | 'amber' | 'indigo';

// Literal class strings so Tailwind's JIT can detect the arbitrary gradients.
const VARIANT_CLASSES: Record<VibrantVariant, string> = {
    default:
        'bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]',
    amber: 'bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.12),transparent_60%)]',
    indigo: 'bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(105,113,236,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(105,113,236,0.12),transparent_60%)]',
};

interface VibrantBackgroundProps extends HTMLAttributes<HTMLDivElement> {
    variant?: VibrantVariant;
}

export function VibrantBackground({
    variant = 'default',
    className,
    ...props
}: VibrantBackgroundProps) {
    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-0 -z-10 ${VARIANT_CLASSES[variant]} ${className ?? ''}`}
            {...props}
        />
    );
}
