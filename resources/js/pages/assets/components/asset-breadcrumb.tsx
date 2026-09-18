import { ChevronRight, Route } from 'lucide-react';
import { LEVEL_TINTS } from '@/lib/classification-levels';
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
            aria-label="Rute klasifikasi"
            className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-lg"
        >
            <span className="mr-1 inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                <Route className="size-3.5" />
                Rute
            </span>
            <button
                type="button"
                onClick={onClear}
                className="rounded-md px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-white/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
                                'rounded-md border border-dashed border-transparent px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                                LEVEL_TINTS[c.level].bg,
                                LEVEL_TINTS[c.level].fg,
                                last && 'font-semibold ring-1 ring-primary/30',
                            )}
                        >
                            {c.name}
                            {c.code && (
                                <span className="ml-1.5 font-mono text-[13px] font-bold tracking-wider opacity-70">
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
