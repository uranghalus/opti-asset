import { FolderOpen, PackageOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LEVEL_TINTS, LevelIcon } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import type { ClassificationLevel } from '@/types/classification';
import { LEVEL_DEPTH } from './types';
import type { BrowseNode } from './types';

function IndexRow({
    node,
    selectedId,
    onSelect,
}: {
    node: BrowseNode;
    selectedId: string | null;
    onSelect: (n: BrowseNode) => void;
}) {
    const isSel = selectedId === node.id;
    const tint = LEVEL_TINTS[node.level];

    return (
        <button
            type="button"
            onClick={() => onSelect(node)}
            role="treeitem"
            aria-selected={isSel}
            className={cn(
                'flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-sm transition-colors duration-200',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                isSel
                    ? 'bg-primary-muted font-medium text-primary'
                    : 'text-foreground hover:bg-muted',
            )}
            style={{ paddingLeft: `${LEVEL_DEPTH[node.level] * 14 + 10}px` }}
        >
            <LevelIcon level={node.level} size="sm" open={isSel} />
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {node.code && (
                <span
                    className={cn(
                        'shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[13px] font-bold tracking-wider',
                        tint.bg,
                        tint.fg,
                    )}
                >
                    {node.code}
                </span>
            )}
            <span className="shrink-0 font-mono text-[13px] text-muted-foreground tabular-nums">
                {node.asset_count ?? 0}
            </span>
        </button>
    );
}

/**
 * Rel indeks klasifikasi — register kaca di sisi lembar kerja.
 * Fungsi tree (pilih, cari, reset) tidak berubah.
 */
export function ClassificationSidebar({
    tree,
    selectedId,
    selectedNode,
    visibleFolders,
    treeSearch,
    totalAssets,
    unclassifiedCount,
    unclassifiedLevel,
    drawerOpen,
    onTreeSearch,
    onSelect,
    onClear,
}: {
    tree: BrowseNode[];
    selectedId: string | null;
    selectedNode: BrowseNode | null;
    visibleFolders: BrowseNode[];
    treeSearch: string;
    totalAssets: number;
    unclassifiedCount: number;
    /** Level akar pohon role aktif — scope "Tanpa Klasifikasi" harus cocok. */
    unclassifiedLevel: ClassificationLevel;
    drawerOpen: boolean;
    onTreeSearch: (v: string) => void;
    onSelect: (n: BrowseNode) => void;
    onClear: () => void;
}) {
    const unclassifiedNode: BrowseNode = {
        id: 'unclassified',
        level: unclassifiedLevel,
        code: null,
        name: 'Tanpa Klasifikasi',
        description: null,
        child_count: 0,
        asset_count: unclassifiedCount,
        children: [],
    } as BrowseNode;
    const showUnclassified =
        unclassifiedCount > 0 &&
        ('tanpa klasifikasi'.includes(treeSearch.trim().toLowerCase()) ||
            treeSearch.trim() === '');

    return (
        <aside
            aria-label="Indeks klasifikasi"
            className={cn(
                'flex shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card',
                'lg:sticky lg:top-4 lg:w-[300px]',
                drawerOpen ? 'flex' : 'hidden lg:flex',
            )}
        >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                    Indeks Klasifikasi
                </h2>
                <span className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-xs font-semibold text-ink-muted tabular-nums dark:bg-muted dark:text-muted-foreground">
                    {tree.length}
                </span>
            </div>

            <div className="border-b border-border p-2.5">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari register..."
                        value={treeSearch}
                        onChange={(e) => onTreeSearch(e.target.value)}
                        aria-label="Cari klasifikasi"
                        className="h-9 rounded-md pr-3 pl-9 text-sm"
                    />
                </div>
            </div>

            <div
                className="manifest-scroll max-h-[50vh] overflow-y-auto p-2 lg:max-h-[60vh]"
                role="tree"
                aria-label="Klasifikasi"
            >
                {selectedId && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="mb-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        Semua Aset
                        <span className="ml-auto font-mono text-[13px] text-muted-foreground tabular-nums">
                            {totalAssets}
                        </span>
                    </button>
                )}

                {visibleFolders.length === 0 && !showUnclassified ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Tidak ada klasifikasi.
                    </p>
                ) : (
                    visibleFolders.map((n) => {
                        const isParent = selectedNode
                            ? (selectedNode.children ?? []).some(
                                  (c) => c.id === n.id,
                              )
                            : false;

                        return (
                            <div key={n.id}>
                                <IndexRow
                                    node={n}
                                    selectedId={selectedId}
                                    onSelect={onSelect}
                                />
                                {isParent && (n.children ?? []).length > 0 && (
                                    <div className="ml-3 border-l border-border pl-1.5">
                                        {(n.children ?? []).map(
                                            (ch: BrowseNode) => (
                                                <IndexRow
                                                    key={ch.id}
                                                    node={ch}
                                                    selectedId={selectedId}
                                                    onSelect={onSelect}
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                {showUnclassified && (
                    <button
                        type="button"
                        onClick={() => onSelect(unclassifiedNode)}
                        role="treeitem"
                        aria-selected={selectedId === unclassifiedNode.id}
                        className={cn(
                            'mt-1.5 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-left text-sm transition-colors duration-200',
                            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                            selectedId === unclassifiedNode.id
                                ? 'bg-primary-muted font-medium text-primary'
                                : 'text-foreground hover:bg-muted',
                        )}
                    >
                        <PackageOpen className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">
                            Tanpa Klasifikasi
                        </span>
                        <span className="shrink-0 font-mono text-[13px] text-muted-foreground tabular-nums">
                            {unclassifiedCount}
                        </span>
                    </button>
                )}
            </div>
        </aside>
    );
}
