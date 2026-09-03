import { LEVEL_TINTS, LevelIcon } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { CHILD_LABELS } from '@/types/classification';
import type { ClassificationLevel } from '@/types/classification';
import type { BrowseNode } from './types';
import { LEVEL_DEPTH } from './types';

function BaySlot({
    node,
    slotNo,
    onSelect,
}: {
    node: BrowseNode;
    slotNo: number;
    onSelect: (n: BrowseNode) => void;
}) {
    const tint = LEVEL_TINTS[node.level];

    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            className={cn(
                'group flex min-w-[180px] flex-1 items-center gap-2.5 rounded-md border border-white/20 bg-card/70 px-3 py-2.5 text-left backdrop-blur-sm transition-all duration-200',
                'hover:bg-card hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
            )}
            style={{ marginLeft: `${LEVEL_DEPTH[node.level] * 4}px` }}
        >
            <LevelIcon level={node.level} size="sm" />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                    {node.name}
                </span>
                <span className="mt-0.5 block font-mono text-[13px] font-bold tracking-wider text-muted-foreground">
                    BAY-{String(slotNo).padStart(2, '0')}
                    {node.code ? ` · ${node.code}` : ''}
                </span>
            </span>
            <span
                className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums',
                    tint.bg,
                    tint.fg,
                )}
            >
                {node.asset_count ?? 0}
            </span>
        </button>
    );
}

/**
 * Slot teluk kaca — anak klasifikasi sebagai petak bernomor
 * yang mengantar drill-down satu tingkat lebih dalam.
 */
export function FolderChips({
    selectedNode,
    childFolders,
    onSelect,
}: {
    selectedNode: BrowseNode;
    childFolders: BrowseNode[];
    onSelect: (n: BrowseNode) => void;
}) {
    if (childFolders.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3 sm:px-5">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {CHILD_LABELS[
                    selectedNode.level as Exclude<
                        ClassificationLevel,
                        'sub-cluster'
                    >
                ] ?? 'Sub'}{' '}
                di {selectedNode.name} — pilih teluk untuk masuk
            </p>
            <div className="flex flex-wrap gap-2">
                {childFolders.map((f, i) => (
                    <BaySlot
                        key={f.id}
                        node={f}
                        slotNo={i + 1}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
