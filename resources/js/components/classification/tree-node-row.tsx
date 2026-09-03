import {
    ChevronRight,
    Copy,
    GripVertical,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LevelIcon, LEVEL_TINTS } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import type {
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { CHILD_LABELS } from '@/types/classification';

export type NodeInfo = {
    node: ClassificationNode;
    parent: ClassificationNode | null;
    depth: number;
    level: ClassificationLevel;
};

export type DropPos = 'before' | 'after' | 'inside';

export type RowProps = {
    node: ClassificationNode;
    parent?: ClassificationNode | null;
    depth: number;
    query: string;
    queryActive: boolean;
    expandedIds: Set<string>;
    selectedId: string | null;
    multiSelect: boolean;
    selectedIds: Set<string>;
    dragId: string | null;
    over: { id: string; pos: DropPos } | null;
    deletingId: string | null;
    onSelect: (id: string) => void;
    onToggleExpand: (id: string) => void;
    onEdit: (info: NodeInfo) => void;
    onDelete: (info: NodeInfo) => void;
    onDuplicate: (node: ClassificationNode) => void;
    onAddChild: (info: NodeInfo) => void;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    onDragOver: (target: NodeInfo, pos: DropPos | null) => void;
    onDrop: (target: NodeInfo, pos: DropPos) => void;
};

export const LEVEL_ORDER: ClassificationLevel[] = [
    'group',
    'category',
    'cluster',
    'sub-cluster',
];

export const levelAt = (depth: number): ClassificationLevel =>
    LEVEL_ORDER[Math.min(depth, 3)];

export const childLevel = (level: ClassificationLevel): ClassificationLevel =>
    LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(level) + 1, 3)];

const DROP_EDGE = 0.3;
const INDENT_PX = 16;
const INDENT_BASE_PX = 8;

export function TreeNodeRow({
    node,
    parent = null,
    depth,
    query,
    queryActive,
    expandedIds,
    selectedId,
    multiSelect,
    selectedIds,
    dragId,
    over,
    deletingId,
    onSelect,
    onToggleExpand,
    onEdit,
    onDelete,
    onDuplicate,
    onAddChild,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
}: RowProps) {
    const level = levelAt(depth);
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isSelected = selectedId === node.id;
    const isMultiSelected = selectedIds.has(node.id);
    const isDragging = dragId === node.id;
    const isOver = over?.id === node.id;
    const isExpanded = queryActive || expandedIds.has(node.id);
    const isDeleting = deletingId === node.id;
    const info: NodeInfo = { node, parent, depth, level };
    const q = query.trim().toLowerCase();
    const matches =
        q !== '' &&
        (node.name.toLowerCase().includes(q) ||
            (node.code?.toLowerCase().includes(q) ?? false));

    const countLabel =
        level === 'sub-cluster'
            ? `${node.item_count ?? 0} aset`
            : `${node.child_count} ${CHILD_LABELS[level]}`;

    const computePos = (event: React.DragEvent): DropPos => {
        const rect = event.currentTarget.getBoundingClientRect();
        const fraction = (event.clientY - rect.top) / rect.height;

        return fraction < DROP_EDGE
            ? 'before'
            : fraction > 1 - DROP_EDGE
              ? 'after'
              : 'inside';
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        onDragOver(info, computePos(event));
    };

    return (
        <div
            className={cn(
                'relative',
                isDragging && 'opacity-40',
                isDeleting && 'pointer-events-none opacity-50',
                isOver &&
                    over?.pos === 'inside' &&
                    'z-10 rounded-lg ring-2 ring-primary/60',
            )}
        >
            {isOver && over?.pos === 'before' && (
                <div className="absolute top-0 right-1.5 left-1.5 z-10 h-0.5 rounded-full bg-primary" />
            )}
            {isOver && over?.pos === 'after' && (
                <div className="absolute right-1.5 bottom-0 left-1.5 z-10 h-0.5 rounded-full bg-primary" />
            )}

            <div
                className={cn(
                    'group flex h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm transition-all duration-150',
                    isSelected
                        ? 'bg-primary/10 font-medium text-primary shadow-[inset_0_0_0_1px_rgba(0,111,207,0.15)]'
                        : 'text-foreground hover:bg-muted/70',
                    isMultiSelected &&
                        !isSelected &&
                        'bg-primary/5 shadow-[inset_0_0_0_1px_rgba(0,111,207,0.12)]',
                    matches && 'shadow-[inset_0_0_0_1px_rgba(0,111,207,0.3)]',
                )}
                style={{
                    paddingLeft: `${depth * INDENT_PX + INDENT_BASE_PX}px`,
                }}
                role="treeitem"
                aria-selected={isSelected}
                tabIndex={0}
                draggable={!multiSelect}
                onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', node.id);
                    event.dataTransfer.effectAllowed = 'move';
                    onDragStart(node.id);
                }}
                onDragOver={handleDragOver}
                onDragLeave={(event) => {
                    if (
                        !(event.relatedTarget instanceof Node) ||
                        !event.currentTarget.contains(event.relatedTarget)
                    ) {
                        onDragOver(info, null);
                    }
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    onDrop(info, over?.pos ?? computePos(event));
                }}
                onDragEnd={onDragEnd}
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(node.id);
                    }
                }}
            >
                {multiSelect && (
                    <Checkbox
                        checked={isMultiSelected}
                        onCheckedChange={() => onSelect(node.id)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Pilih ${node.name}`}
                    />
                )}

                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleExpand(node.id);
                        }}
                        className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-150 hover:bg-accent',
                            isExpanded && 'rotate-90',
                        )}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Ciutkan' : 'Perluas'}
                    >
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                    </button>
                ) : (
                    <span className="size-6 shrink-0" />
                )}

                <LevelIcon level={level} open={isExpanded} />

                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium transition-transform duration-200 group-hover:translate-x-0.5">
                            {node.name}
                        </span>
                        {node.code && (
                            <span
                                className={cn(
                                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]',
                                    LEVEL_TINTS[level].bg,
                                    LEVEL_TINTS[level].fg,
                                )}
                            >
                                {node.code}
                            </span>
                        )}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                        {countLabel}
                        {node.description ? ` • ${node.description}` : ''}
                    </span>
                </span>

                {!multiSelect && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`Menu ${node.name}`}
                            >
                                {isDeleting ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <GripVertical className="size-3.5" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="min-w-[180px]"
                        >
                            <DropdownMenuItem onClick={() => onEdit(info)}>
                                <Pencil className="size-4" />
                                Edit
                            </DropdownMenuItem>
                            {level !== 'sub-cluster' && (
                                <DropdownMenuItem
                                    onClick={() => onAddChild(info)}
                                >
                                    <Plus className="size-4" />
                                    Tambah {CHILD_LABELS[level]}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onDuplicate(node)}>
                                <Copy className="size-4" />
                                Duplikat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(info)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-4" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div role="group">
                    {children.map((child) => (
                        <TreeNodeRow
                            key={child.id}
                            node={child}
                            parent={node}
                            depth={depth + 1}
                            query={query}
                            queryActive={queryActive}
                            expandedIds={expandedIds}
                            selectedId={selectedId}
                            multiSelect={multiSelect}
                            selectedIds={selectedIds}
                            dragId={dragId}
                            over={over}
                            deletingId={deletingId}
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onAddChild={onAddChild}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
