import { LEVEL_TINTS, LevelIcon } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { CHILD_LABELS } from '@/types/classification';
import type { ClassificationLevel } from '@/types/classification';
import type { BrowseNode } from './types';
import { LEVEL_DEPTH } from './types';

function BaySlot({
    node,
    onSelect,
}: {
    node: BrowseNode;
    onSelect: (n: BrowseNode) => void;
}) {
    const tint = LEVEL_TINTS[node.level];

    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            className={cn(
                'group flex min-w-[180px] flex-1 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors duration-200',
                'hover:border-border-strong hover:bg-surface-sunken/60',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
            )}
            style={{ marginLeft: `${LEVEL_DEPTH[node.level] * 4}px` }}
        >
            <LevelIcon level={node.level} size="sm" />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                    {node.name}
                </span>
                {node.code && (
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                        {node.code}
                    </span>
                )}
            </span>
            <span
                className={cn(
                    'shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-semibold tabular-nums',
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
        <div className="border-b border-border bg-surface-sunken px-4 py-3 sm:px-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
                {CHILD_LABELS[
                    selectedNode.level as Exclude<
                        ClassificationLevel,
                        'sub-cluster'
                    >
                ] ?? 'Sub'}{' '}
                di {selectedNode.name}
            </p>
            <div className="flex flex-wrap gap-2">
                {childFolders.map((f) => (
                    <BaySlot key={f.id} node={f} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
}
