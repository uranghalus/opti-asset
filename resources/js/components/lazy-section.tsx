import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function LazySection({
    children,
    className = '',
    fallback = null,
    rootMargin = '0px 0px 100px 0px',
}: {
    children: ReactNode;
    className?: string;
    fallback?: ReactNode;
    rootMargin?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(
        () => typeof IntersectionObserver === 'undefined',
    );

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        io.disconnect();
                    }
                });
            },
            { rootMargin, threshold: 0.05 },
        );

        io.observe(el);

        return () => io.disconnect();
    }, [rootMargin]);

    return (
        <div ref={ref} className={className}>
            {isVisible ? children : fallback}
        </div>
    );
}
