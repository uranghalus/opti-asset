import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassificationLevel } from '@/types/classification';
import type { BrowseNode } from './types';

/**
 * Strip rute drill-down — tiket perjalanan kaca dari akar
 * sampai simpul aktif. Navigasi dan reset tidak berubah.
 */
export function AssetBreadcrumb({
    breadcrumb,
    onClear,
    onNavigate,
}: {
    breadcrumb: Array<{
        id: string;
        level: ClassificationLevel;
        code: string | null;
        name: string;
    }>;
    onClear: () => void;
    onNavigate: (node: BrowseNode) => void;
}) {
    if (breadcrumb.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="Lokasi dalam klasifikasi"
            className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
        >
            <button
                type="button"
                onClick={onClear}
                className="rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
                Semua
            </button>
            {breadcrumb.map((c, i) => {
                const last = i === breadcrumb.length - 1;

                return (
                    <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5"
                    >
                        <ChevronRight
                            aria-hidden
                            className="size-3.5 text-muted-foreground/50"
                        />
                        <button
                            type="button"
                            aria-current={last ? 'location' : undefined}
                            onClick={() =>
                                onNavigate({
                                    ...c,
                                    description: null,
                                    child_count: 0,
                                    children: [],
                                } as BrowseNode)
                            }
                            className={cn(
                                'rounded-md px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                                last
                                    ? 'bg-primary-muted font-semibold text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            {c.name}
                            {c.code && (
                                <span className="ml-1.5 font-mono text-xs opacity-70">
                                    {c.code}
                                </span>
                            )}
                        </button>
                    </span>
                );
            })}
        </nav>
    );
}
