import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    Copy,
    Download,
    Folder,
    FolderOpen,
    GripVertical,
    Inbox,
    ListChecks,
    ListX,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    destroyCategory,
    destroyCluster,
    destroyGroup,
    destroySubCluster,
    importMethod,
    reorder,
    storeCategory,
    storeCluster,
    storeGroup,
    storeSubCluster,
} from '@/actions/App/Http/Controllers/AssetClassificationController';
import { ClassificationDetailPanel } from '@/components/classification/classification-detail-panel';
import { ClassificationForm } from '@/components/classification/classification-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    LevelIcon,
    LEVEL_SHORT,
    LEVEL_TINTS,
} from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import { index } from '@/routes/asset-classification';
import type {
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { CHILD_LABELS, LEVEL_LABELS } from '@/types/classification';

type PageProps = {
    groups: ClassificationNode[];
};

type FormState = {
    level: ClassificationLevel;
    item: ClassificationNode | null;
};

type DeleteState = {
    level: ClassificationLevel;
    item: ClassificationNode;
};

type NodeInfo = {
    node: ClassificationNode;
    parent: ClassificationNode | null;
    depth: number;
    level: ClassificationLevel;
};

type DropPos = 'before' | 'after' | 'inside';

type RouteFn = (id: string) => { url: string; method: string };

const LEVEL_ORDER: ClassificationLevel[] = [
    'group',
    'category',
    'cluster',
    'sub-cluster',
];

const DESTROY: Record<ClassificationLevel, RouteFn> = {
    group: destroyGroup,
    category: destroyCategory,
    cluster: destroyCluster,
    'sub-cluster': destroySubCluster,
};

const STORE: Record<
    ClassificationLevel,
    () => { url: string; method: string }
> = {
    group: storeGroup,
    category: storeCategory,
    cluster: storeCluster,
    'sub-cluster': storeSubCluster,
};

const PARENT_FIELD: Partial<Record<ClassificationLevel, string>> = {
    category: 'asset_group_id',
    cluster: 'asset_category_id',
    'sub-cluster': 'asset_cluster_id',
};

const levelAt = (depth: number): ClassificationLevel =>
    LEVEL_ORDER[Math.min(depth, 3)];

const childLevel = (level: ClassificationLevel): ClassificationLevel =>
    LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(level) + 1, 3)];

function findInfo(
    nodes: ClassificationNode[],
    id: string,
    depth = 0,
    parent: ClassificationNode | null = null,
): NodeInfo | null {
    for (const node of nodes) {
        if (node.id === id) {
            return { node, parent, depth, level: levelAt(depth) };
        }

        const found = findInfo(node.children ?? [], id, depth + 1, node);

        if (found) {
            return found;
        }
    }

    return null;
}

function ancestorsOf(
    nodes: ClassificationNode[],
    id: string,
): ClassificationNode[] {
    const walk = (
        list: ClassificationNode[],
        trail: ClassificationNode[],
    ): ClassificationNode[] | null => {
        for (const node of list) {
            if (node.id === id) {
                return trail;
            }

            const found = walk(node.children ?? [], [...trail, node]);

            if (found) {
                return found;
            }
        }

        return null;
    };

    return walk(nodes, []) ?? [];
}

function filterNodes(
    nodes: ClassificationNode[],
    query: string,
): ClassificationNode[] {
    const q = query.trim().toLowerCase();

    if (!q) {
        return nodes;
    }

    const result: ClassificationNode[] = [];

    for (const node of nodes) {
        const selfMatch =
            node.name.toLowerCase().includes(q) ||
            (node.code?.toLowerCase().includes(q) ?? false);
        const childNodes = filterNodes(node.children ?? [], q);

        if (selfMatch) {
            result.push(node);
        } else if (childNodes.length > 0) {
            result.push({ ...node, children: childNodes });
        }
    }

    return result;
}

function descendantBreakdown(item: ClassificationNode) {
    const breakdown: Record<Exclude<ClassificationLevel, 'group'>, number> = {
        category: 0,
        cluster: 0,
        'sub-cluster': 0,
    };

    const walk = (nodes: ClassificationNode[] | undefined, depth: number) => {
        nodes?.forEach((node) => {
            if (depth === 0) {
                breakdown.category += 1;
            } else if (depth === 1) {
                breakdown.cluster += 1;
            } else if (depth === 2) {
                breakdown['sub-cluster'] += 1;
            }

            walk(node.children, depth + 1);
        });
    };

    walk(item.children, 0);

    return breakdown;
}

function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const source = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (inQuotes) {
            if (char === '"') {
                if (source[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && source[i + 1] === '\n') {
                i += 1;
            }

            row.push(field);
            field = '';

            if (row.some((cell) => cell.trim() !== '')) {
                rows.push(row);
            }

            row = [];
        } else {
            field += char;
        }
    }

    row.push(field);

    if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row);
    }

    return rows;
}

type ImportRow = {
    level: string;
    name: string;
    code: string;
    description: string;
    parent_code: string;
};

function rowsFromCsv(text: string): ImportRow[] {
    const rows = parseCsv(text);

    if (rows.length === 0) {
        return [];
    }

    const header = rows[0].map((h) => h.trim());
    const indexOf = (name: string) => header.indexOf(name);

    return rows
        .slice(1)
        .map((cells) => {
            const at = (name: string) =>
                indexOf(name) === -1
                    ? ''
                    : (cells[indexOf(name)]?.trim() ?? '');

            return {
                level: at('level').toLowerCase(),
                name: at('name'),
                code: at('code'),
                description: at('description'),
                parent_code: at('parent_code'),
            };
        })
        .filter((row) => row.name !== '');
}

export default function AssetClassification() {
    const { groups } = usePage().props as unknown as PageProps;

    const [query, setQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formState, setFormState] = useState<FormState | null>(null);
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const [multiSelect, setMultiSelect] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [dragId, setDragId] = useState<string | null>(null);
    const [over, setOver] = useState<{ id: string; pos: DropPos } | null>(null);
    const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const queryActive = query.trim().length > 0;
    const visibleTree = useMemo(
        () => filterNodes(groups, query),
        [groups, query],
    );

    const selectedInfo = useMemo(
        () => (selectedId ? findInfo(groups, selectedId) : null),
        [groups, selectedId],
    );
    const selectedAncestors = useMemo(
        () => (selectedId ? ancestorsOf(groups, selectedId) : []),
        [groups, selectedId],
    );

    const totals = useMemo(() => {
        const count: Record<Exclude<ClassificationLevel, 'group'>, number> = {
            category: 0,
            cluster: 0,
            'sub-cluster': 0,
        };

        const walk = (
            nodes: ClassificationNode[] | undefined,
            depth: number,
        ) => {
            nodes?.forEach((node) => {
                if (depth === 1) {
                    count.category += 1;
                } else if (depth === 2) {
                    count.cluster += 1;
                } else if (depth === 3) {
                    count['sub-cluster'] += 1;
                }

                walk(node.children, depth + 1);
            });
        };

        walk(groups, 0);

        return {
            group: groups.length,
            ...count,
        } as Record<ClassificationLevel, number>;
    }, [groups]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const all = new Set<string>();
        const walk = (nodes: ClassificationNode[]) => {
            for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                    all.add(node.id);
                    walk(node.children);
                }
            }
        };
        walk(groups);
        setExpandedIds(all);
    }, [groups]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    const validDrop = useCallback(
        (sourceId: string, target: NodeInfo, pos: DropPos): boolean => {
            const source = findInfo(groups, sourceId);

            if (!source || source.node.id === target.node.id) {
                return false;
            }

            if (
                ancestorsOf(groups, target.node.id).some(
                    (a) => a.id === sourceId,
                )
            ) {
                return false;
            }

            if (pos === 'inside') {
                if (source.level === 'group') {
                    return false;
                }

                return (
                    target.level ===
                    levelAt(LEVEL_ORDER.indexOf(source.level) - 1)
                );
            }

            return target.level === source.level;
        },
        [groups],
    );

    const submitReorder = useCallback(
        (
            level: ClassificationLevel,
            parentId: string | null,
            list: ClassificationNode[],
        ) => {
            router.post(
                reorder().url,
                {
                    level,
                    parent_id: parentId ?? null,
                    ids: list.map((node) => node.id),
                },
                {
                    only: ['groups'],
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Urutan klasifikasi diperbarui.');
                    },
                },
            );
        },
        [],
    );

    const performDrop = useCallback(
        (sourceId: string, target: NodeInfo, pos: DropPos) => {
            setOver(null);
            setDragId(null);

            const source = findInfo(groups, sourceId);

            if (!source) {
                return;
            }

            if (!validDrop(sourceId, target, pos)) {
                toast.error('Tidak dapat memindahkan item ke posisi tersebut.');

                return;
            }

            if (pos === 'inside') {
                const list = [
                    ...(target.node.children ?? []).filter(
                        (n) => n.id !== sourceId,
                    ),
                    source.node,
                ];
                submitReorder(childLevel(target.level), target.node.id, list);

                return;
            }

            const parent = findInfo(groups, target.node.id)?.parent ?? null;
            const siblings = parent ? (parent.children ?? []) : groups;
            const list = siblings.filter((n) => n.id !== sourceId);
            const targetIndex = list.findIndex((n) => n.id === target.node.id);
            list.splice(
                pos === 'before' ? targetIndex : targetIndex + 1,
                0,
                source.node,
            );
            submitReorder(source.level, parent?.id ?? null, list);
        },
        [groups, validDrop, submitReorder],
    );

    const handleDuplicate = useCallback(
        (node: ClassificationNode) => {
            const info = findInfo(groups, node.id);
            const level = info?.level ?? 'group';
            const payload: Record<string, string | null> = {
                code: null,
                name: `${node.name} (salinan)`,
                description: node.description ?? null,
            };
            const parentField = PARENT_FIELD[level];

            if (parentField && info?.parent) {
                payload[parentField] = info.parent.id;
            }

            router.post(STORE[level]().url, payload, {
                only: ['groups'],
                preserveState: true,
                onSuccess: () => {
                    toast.success(`"${node.name}" berhasil diduplikasi.`);
                },
            });
        },
        [groups],
    );

    const handleDelete = useCallback(() => {
        if (!deleteState) {
            return;
        }

        const { level: levelKey, item } = deleteState;

        router.delete(DESTROY[levelKey](item.id).url, {
            only: ['groups'],
            preserveState: true,
            onSuccess: () => {
                setDeleteState(null);

                if (selectedId === item.id) {
                    setSelectedId(null);
                }

                toast.success(`"${item.name}" berhasil dihapus.`);
            },
        });
    }, [deleteState, selectedId]);

    const toggleMultiSelectItem = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }, []);

    const bulkDelete = useCallback(() => {
        const topmost = Array.from(selectedIds).filter((id) => {
            const info = findInfo(groups, id);

            return !info?.parent || !selectedIds.has(info.parent.id);
        });

        const run = (ids: string[], index = 0) => {
            if (index >= ids.length) {
                setSelectedIds(new Set());
                setMultiSelect(false);
                toast.success(`${ids.length} item berhasil dihapus.`);

                return;
            }

            const id = ids[index];
            const info = findInfo(groups, id);

            if (!info) {
                run(ids, index + 1);

                return;
            }

            router.delete(DESTROY[info.level](id).url, {
                only: ['groups'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => run(ids, index + 1),
            });
        };

        run(topmost);
    }, [selectedIds, groups]);

    const handleExport = useCallback(() => {
        const lines: string[][] = [
            ['level', 'code', 'name', 'description', 'parent_code'],
        ];

        const walk = (
            nodes: ClassificationNode[],
            level: string,
            parentCode: string,
        ) => {
            for (const node of nodes) {
                lines.push([
                    level,
                    node.code ?? '',
                    node.name,
                    node.description ?? '',
                    parentCode,
                ]);
                walk(
                    node.children ?? [],
                    childLevel(level as ClassificationLevel),
                    node.code ?? '',
                );
            }
        };

        walk(groups, 'group', '');

        const csv = lines
            .map((row) =>
                row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
            )
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'klasifikasi-asset.csv';
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Klasifikasi asset berhasil diekspor.');
    }, [groups]);

    const handleImportFile = useCallback((file: File) => {
        const reader = new FileReader();

        reader.onload = () => {
            const rows = rowsFromCsv(reader.result as string);

            if (rows.length === 0) {
                toast.error(
                    'File CSV tidak valid. Pastikan ada kolom level, name.',
                );

                return;
            }

            setImportRows(rows);
        };

        reader.readAsText(file);
    }, []);

    const runImport = useCallback(() => {
        if (!importRows || importing) {
            return;
        }

        setImporting(true);

        router.post(
            importMethod().url,
            { rows: importRows },
            {
                only: ['groups'],
                preserveState: true,
                onSuccess: () => {
                    setImporting(false);
                    setImportRows(null);
                    toast.success(
                        `${importRows.length} baris berhasil diimpor.`,
                    );
                },
                onError: () => {
                    setImporting(false);
                    toast.error('Impor gagal. Periksa format dan kode unik.');
                },
            },
        );
    }, [importRows, importing]);

    const openCreate = (
        level: ClassificationLevel,
        parentId: string | null,
    ) => {
        if (parentId) {
            setSelectedId(parentId);
        }

        setFormState({ level, item: null });
    };

    const deleteBreakdown = deleteState
        ? descendantBreakdown(deleteState.item)
        : null;
    const affectedParts =
        deleteState && deleteBreakdown
            ? (
                  Object.entries(deleteBreakdown) as [
                      Exclude<ClassificationLevel, 'group'>,
                      number,
                  ][]
              )
                  .filter(([, count]) => count > 0)
                  .map(
                      ([levelKey, count]) =>
                          `${count} ${LEVEL_LABELS[levelKey]}`,
                  )
            : [];

    return (
        <>
            <Head title="Klasifikasi Asset" />

            <div
                className="flex min-h-[100dvh] flex-col p-4 md:p-8"
                style={{
                    background:
                        'radial-gradient(62% 45% at 8% 0%, color-mix(in oklch, var(--primary) 9%, transparent) 0%, transparent 60%), var(--background)',
                }}
            >
                <div className="mx-auto w-full max-w-7xl">
                    <div className="card-enter flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bezel-outer">
                                <div className="bezel-inner flex size-9 items-center justify-center text-primary">
                                    <Folder
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Klasifikasi Asset
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Kelola hierarki master data: Golongan →
                                    Kategori → Cluster → Sub Cluster.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant={multiSelect ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setMultiSelect((value) => !value);
                                    setSelectedIds(new Set());
                                }}
                                className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                            >
                                <ListChecks
                                    className="size-4"
                                    strokeWidth={1.75}
                                />
                                Multi-select
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                                    >
                                        <MoreHorizontal
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                        Lainnya
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="min-w-[180px]"
                                >
                                    <DropdownMenuItem onClick={handleExport}>
                                        <Download className="size-4" />
                                        Ekspor CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Upload className="size-4" />
                                        Impor CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                size="sm"
                                onClick={() => openCreate('group', null)}
                                className="group ease-premium h-auto gap-2 rounded-full bg-[#006FCF] px-4 py-2.5 text-white shadow-[0_10px_28px_-12px_rgba(0,111,207,0.6)] transition-all duration-300 hover:bg-[#1374D4] active:scale-[0.98] active:bg-[#00509E] dark:bg-[#006FCF] dark:text-white dark:hover:bg-[#1374D4]"
                            >
                                <span className="ease-premium flex size-5 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                                    <Plus
                                        className="size-3.5"
                                        strokeWidth={2.25}
                                    />
                                </span>
                                Tambah Golongan
                            </Button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="sr-only"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];

                                    if (file) {
                                        handleImportFile(file);
                                    }

                                    event.target.value = '';
                                }}
                            />
                        </div>
                    </div>

                    <div className="card-enter mt-6 grid grid-cols-2 gap-3 delay-100 md:grid-cols-4">
                        {(Object.keys(totals) as ClassificationLevel[]).map(
                            (level) => (
                                <div key={level} className="bezel-outer">
                                    <div className="bezel-inner ease-premium flex items-center gap-3 p-3 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]">
                                        <LevelIcon level={level} />
                                        <div className="min-w-0">
                                            <p className="text-xl leading-none font-semibold text-foreground tabular-nums">
                                                {totals[level]}
                                            </p>
                                            <p className="mt-1 truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                                {LEVEL_SHORT[level]}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[400px_1fr]">
                        <section className="bezel-outer card-enter flex flex-col delay-150">
                            <div className="bezel-inner flex min-h-[400px] flex-col overflow-hidden">
                                <div className="relative overflow-hidden bg-[#00175A] px-4 py-3 text-white">
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(90,169,236,0.3),transparent_60%)]"
                                    />
                                    <div className="relative flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-semibold tracking-wide text-white">
                                                Struktur Klasifikasi
                                            </h2>
                                            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/75">
                                                {groups.length} golongan
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ease-premium size-7 text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                                                onClick={expandAll}
                                                aria-label="Perluas semua"
                                            >
                                                <ChevronsUpDown
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="ease-premium size-7 text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                                                onClick={collapseAll}
                                                aria-label="Ciutkan semua"
                                            >
                                                <ChevronsDownUp
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-border px-3 py-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={query}
                                            onChange={(event) =>
                                                setQuery(event.target.value)
                                            }
                                            placeholder="Filter kode / nama..."
                                            className="h-8 rounded-md pl-8 text-sm"
                                        />
                                        {queryActive && (
                                            <button
                                                type="button"
                                                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setQuery('')}
                                                aria-label="Bersihkan filter"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {multiSelect && selectedIds.size > 0 && (
                                    <div className="flex items-center gap-2 border-b border-border bg-[#006FCF]/5 px-3 py-2">
                                        <span className="text-xs font-medium text-foreground">
                                            {selectedIds.size} dipilih
                                        </span>
                                        <div className="ml-auto flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={bulkDelete}
                                            >
                                                <Trash2 className="size-3.5" />
                                                Hapus
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => {
                                                    setSelectedIds(new Set());
                                                    setMultiSelect(false);
                                                }}
                                            >
                                                <ListX className="size-3.5" />
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="flex-1 overflow-y-auto p-2"
                                    style={{
                                        maxHeight: 'calc(100dvh - 430px)',
                                    }}
                                    role="tree"
                                    aria-label="Klasifikasi Asset"
                                >
                                    {groups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-[#006FCF]/10 text-[#006FCF] dark:bg-[#5AA9EC]/15 dark:text-[#5AA9EC]">
                                                <Inbox
                                                    className="size-6"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <p className="max-w-xs text-sm text-muted-foreground">
                                                Belum ada golongan asset. Buat
                                                yang pertama untuk memulai
                                                hierarki klasifikasi.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    openCreate('group', null)
                                                }
                                            >
                                                <Plus className="size-4" />
                                                Tambah Golongan
                                            </Button>
                                        </div>
                                    ) : visibleTree.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-[#006FCF]/10 text-[#006FCF] dark:bg-[#5AA9EC]/15 dark:text-[#5AA9EC]">
                                                <Search
                                                    className="size-6"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <p className="max-w-xs text-sm text-muted-foreground">
                                                Tidak ada hasil untuk "
                                                {query.trim()}".
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuery('')}
                                            >
                                                <X className="size-4" />
                                                Hapus filter
                                            </Button>
                                        </div>
                                    ) : (
                                        visibleTree.map((node) => (
                                            <TreeNodeRow
                                                key={node.id}
                                                node={node}
                                                depth={0}
                                                query={query}
                                                queryActive={queryActive}
                                                expandedIds={expandedIds}
                                                selectedId={selectedId}
                                                multiSelect={multiSelect}
                                                selectedIds={selectedIds}
                                                dragId={dragId}
                                                over={over}
                                                onSelect={(id) =>
                                                    multiSelect
                                                        ? toggleMultiSelectItem(
                                                              id,
                                                          )
                                                        : setSelectedId(id)
                                                }
                                                onToggleExpand={toggleExpand}
                                                onEdit={(target) => {
                                                    setSelectedId(
                                                        target.node.id,
                                                    );
                                                    setFormState({
                                                        level: target.level,
                                                        item: target.node,
                                                    });
                                                }}
                                                onDelete={(target) =>
                                                    setDeleteState({
                                                        level: target.level,
                                                        item: target.node,
                                                    })
                                                }
                                                onDuplicate={handleDuplicate}
                                                onAddChild={(target) =>
                                                    openCreate(
                                                        childLevel(
                                                            target.level,
                                                        ),
                                                        target.node.id,
                                                    )
                                                }
                                                onDragStart={(id) =>
                                                    setDragId(id)
                                                }
                                                onDragEnd={() => {
                                                    setDragId(null);
                                                    setOver(null);
                                                }}
                                                onDragOver={(node, pos) => {
                                                    if (pos === null) {
                                                        setOver(null);

                                                        return;
                                                    }

                                                    const sourceId =
                                                        dragId ?? '';

                                                    if (
                                                        validDrop(
                                                            sourceId,
                                                            node,
                                                            pos,
                                                        )
                                                    ) {
                                                        setOver({
                                                            id: node.node.id,
                                                            pos,
                                                        });

                                                        return;
                                                    }

                                                    if (
                                                        validDrop(
                                                            sourceId,
                                                            node,
                                                            'before',
                                                        )
                                                    ) {
                                                        setOver({
                                                            id: node.node.id,
                                                            pos: 'before',
                                                        });

                                                        return;
                                                    }

                                                    if (
                                                        validDrop(
                                                            sourceId,
                                                            node,
                                                            'after',
                                                        )
                                                    ) {
                                                        setOver({
                                                            id: node.node.id,
                                                            pos: 'after',
                                                        });

                                                        return;
                                                    }

                                                    setOver(null);
                                                }}
                                                onDrop={(target, pos) => {
                                                    if (dragId) {
                                                        performDrop(
                                                            dragId,
                                                            target,
                                                            pos,
                                                        );
                                                    }
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="bezel-outer card-enter flex flex-col delay-200">
                            <div className="bezel-inner flex min-h-[400px] flex-col overflow-hidden lg:min-h-[600px]">
                                {selectedInfo ? (
                                    <ClassificationDetailPanel
                                        level={selectedInfo.level}
                                        node={selectedInfo.node}
                                        ancestors={selectedAncestors}
                                        parentId={
                                            selectedInfo.parent?.id ?? null
                                        }
                                        onEdit={() =>
                                            setFormState({
                                                level: selectedInfo.level,
                                                item: selectedInfo.node,
                                            })
                                        }
                                        onDelete={() =>
                                            setDeleteState({
                                                level: selectedInfo.level,
                                                item: selectedInfo.node,
                                            })
                                        }
                                        onDuplicate={() =>
                                            handleDuplicate(selectedInfo.node)
                                        }
                                        onAddChild={(level) =>
                                            openCreate(
                                                level,
                                                selectedInfo.node.id,
                                            )
                                        }
                                        onClose={() => setSelectedId(null)}
                                    />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
                                        <div className="bezel-outer">
                                            <div className="bezel-inner flex size-14 items-center justify-center text-[#006FCF] dark:text-[#5AA9EC]">
                                                <FolderOpen
                                                    className="size-7"
                                                    strokeWidth={1.25}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-foreground">
                                                Pilih node dari pohon
                                                klasifikasi
                                            </h2>
                                            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                                Klik golongan, kategori,
                                                cluster, atau sub cluster untuk
                                                melihat dan mengedit detailnya.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {formState && (
                <ClassificationForm
                    key={`${formState.level}-${formState.item?.id ?? 'new'}`}
                    level={formState.level}
                    parentId={
                        formState.level === 'group'
                            ? null
                            : formState.item
                              ? (selectedInfo?.parent?.id ?? null)
                              : (selectedInfo?.node.id ?? null)
                    }
                    parentName={
                        formState.level === 'group'
                            ? null
                            : formState.item
                              ? (selectedInfo?.parent?.name ?? null)
                              : (selectedInfo?.node.name ?? null)
                    }
                    item={formState.item}
                    onClose={() => setFormState(null)}
                />
            )}

            <Dialog
                open={deleteState !== null}
                onOpenChange={(open) => !open && setDeleteState(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Hapus {deleteState?.item.name}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteState && affectedParts.length > 0
                                ? `Menghapus "${deleteState.item.name}" akan ikut menghapus ${affectedParts.join(
                                      ', ',
                                  )} di dalamnya. Tindakan ini tidak dapat dibatalkan.`
                                : `Yakin ingin menghapus "${deleteState?.item.name}"? Tindakan ini tidak dapat dibatalkan.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteState(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={importRows !== null}
                onOpenChange={(open) => !open && setImportRows(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Impor Klasifikasi Asset</DialogTitle>
                        <DialogDescription>
                            {importRows
                                ? `${importRows.length} baris siap diimpor. Kode parent harus mengacu ke baris yang sudah ada atau berada di file yang sama.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {importRows && (
                        <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">
                                            Level
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Kode
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Nama
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Parent
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importRows
                                        .slice(0, 8)
                                        .map((row, index) => (
                                            <tr
                                                key={index}
                                                className="border-t border-border"
                                            >
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {row.level}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-xs">
                                                    {row.code}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {row.name}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {row.parent_code}
                                                </td>
                                            </tr>
                                        ))}
                                    {importRows.length > 8 && (
                                        <tr className="border-t border-border">
                                            <td
                                                colSpan={4}
                                                className="px-3 py-2 text-center text-xs text-muted-foreground"
                                            >
                                                +{importRows.length - 8} baris
                                                lainnya
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImportRows(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={runImport}
                            disabled={importing}
                        >
                            {importing && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Impor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

type RowProps = {
    node: ClassificationNode;
    depth: number;
    query: string;
    queryActive: boolean;
    expandedIds: Set<string>;
    selectedId: string | null;
    multiSelect: boolean;
    selectedIds: Set<string>;
    dragId: string | null;
    over: { id: string; pos: DropPos } | null;
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

function TreeNodeRow({
    node,
    depth,
    query,
    queryActive,
    expandedIds,
    selectedId,
    multiSelect,
    selectedIds,
    dragId,
    over,
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
    const info: NodeInfo = { node, parent: null, depth, level };
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

        return fraction < 0.3 ? 'before' : fraction > 0.7 ? 'after' : 'inside';
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
                isOver &&
                    over?.pos === 'inside' &&
                    'z-10 rounded-lg ring-2 ring-primary/60',
            )}
        >
            {isOver && over?.pos === 'before' && (
                <div className="absolute top-0 right-1 left-1 z-10 h-0.5 rounded-full bg-primary" />
            )}
            {isOver && over?.pos === 'after' && (
                <div className="absolute right-1 bottom-0 left-1 z-10 h-0.5 rounded-full bg-primary" />
            )}

            <div
                className={cn(
                    'group ease-premium flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm transition-all duration-300 active:scale-[0.99]',
                    isSelected
                        ? 'bg-[#006FCF]/10 font-medium text-[#006FCF] dark:bg-[#5AA9EC]/15 dark:text-[#5AA9EC]'
                        : 'text-foreground hover:bg-muted/70',
                    isMultiSelected &&
                        !isSelected &&
                        'bg-[#006FCF]/5 ring-1 ring-[#006FCF]/20 dark:bg-[#5AA9EC]/10',
                    matches && 'ring-1 ring-[#006FCF]/40',
                )}
                style={{ paddingLeft: `${depth * 18 + 8}px` }}
                role="treeitem"
                aria-selected={isSelected}
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
                            'ease-premium flex size-6 shrink-0 items-center justify-center rounded transition-transform duration-300 hover:bg-accent',
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
                        <span className="ease-premium truncate font-medium transition-transform duration-300 group-hover:translate-x-0.5">
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
                                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`Menu ${node.name}`}
                            >
                                <GripVertical className="size-3.5" />
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
                            depth={depth + 1}
                            query={query}
                            queryActive={queryActive}
                            expandedIds={expandedIds}
                            selectedId={selectedId}
                            multiSelect={multiSelect}
                            selectedIds={selectedIds}
                            dragId={dragId}
                            over={over}
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

AssetClassification.layout = {
    breadcrumbs: [
        {
            title: 'Klasifikasi Asset',
            href: index().url,
        },
    ],
};
