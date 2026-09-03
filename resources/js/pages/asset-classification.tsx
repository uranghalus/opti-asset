import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronsDownUp,
    ChevronsUpDown,
    Download,
    Folder,
    FolderOpen,
    Inbox,
    ListChecks,
    ListX,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
    destroyBulk,
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
import {
    TreeNodeRow,
    childLevel,
    levelAt,
    LEVEL_ORDER,
} from '@/components/classification/tree-node-row';
import type {
    DropPos,
    NodeInfo,
} from '@/components/classification/tree-node-row';
import { Button } from '@/components/ui/button';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { rowsFromSheet } from '@/lib/classification-import';
import type { ImportRow } from '@/lib/classification-import';
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
import { LEVEL_LABELS } from '@/types/classification';

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

type RouteFn = (id: string) => { url: string; method: string };

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

export default function AssetClassification() {
    const { groups } = usePage().props as unknown as PageProps;

    const [query, setQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formState, setFormState] = useState<FormState | null>(null);
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [multiSelect, setMultiSelect] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [dragId, setDragId] = useState<string | null>(null);
    const [over, setOver] = useState<{ id: string; pos: DropPos } | null>(null);
    const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isProcessing = useIsProcessing();

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

        setDeletingId(item.id);

        router.delete(DESTROY[levelKey](item.id).url, {
            only: ['groups'],
            preserveState: true,
            onSuccess: () => {
                setDeleteState(null);
                setDeletingId(null);

                if (selectedId === item.id) {
                    setSelectedId(null);
                }

                toast.success(`"${item.name}" berhasil dihapus.`);
            },
            onError: () => {
                setDeletingId(null);
                toast.error(
                    `Gagal menghapus "${item.name}". Silakan coba lagi.`,
                );
            },
            onHttpException: () => {
                setDeletingId(null);
                toast.error(
                    `"${item.name}" tidak ditemukan atau sudah terhapus.`,
                );
            },
            onNetworkError: () => {
                setDeletingId(null);
                toast.error('Koneksi bermasalah. Silakan coba lagi.');
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
            let parent = findInfo(groups, id)?.parent ?? null;

            while (parent) {
                if (selectedIds.has(parent.id)) {
                    return false;
                }

                parent = findInfo(groups, parent.id)?.parent ?? null;
            }

            return true;
        });

        if (topmost.length === 0) {
            return;
        }

        const levels = new Set(
            topmost.map((id) => findInfo(groups, id)?.level),
        );

        if (levels.size !== 1) {
            toast.error(
                'Hapus massal hanya untuk satu level dalam sekali jalan.',
            );

            return;
        }

        const level = [...levels][0];

        if (!level) {
            return;
        }

        const doomed = new Set(topmost);
        setDeletingId(topmost[0] ?? null);

        router.post(
            destroyBulk().url,
            { level, ids: topmost },
            {
                only: ['groups'],
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds(new Set());
                    setMultiSelect(false);
                    setDeletingId(null);
                    toast.success(`${doomed.size} item berhasil dihapus.`);
                },
                onError: () => {
                    setDeletingId(null);
                    toast.error(
                        'Gagal menghapus. Tidak ada item yang dihapus.',
                    );
                },
            },
        );
    }, [selectedIds, groups]);

    const handleExport = useCallback(() => {
        const lines: string[][] = [
            ['level', 'code', 'name', 'description', 'parent_code'],
        ];

        const walk = (
            nodes: ClassificationNode[],
            level: string,
            parentFullCode: string,
        ) => {
            for (const node of nodes) {
                const fullCode = node.code
                    ? parentFullCode
                        ? `${parentFullCode}.${node.code}`
                        : node.code
                    : parentFullCode;

                lines.push([
                    level,
                    fullCode,
                    node.name,
                    node.description ?? '',
                    parentFullCode,
                ]);
                walk(
                    node.children ?? [],
                    childLevel(level as ClassificationLevel),
                    fullCode,
                );
            }
        };

        walk(groups, 'group', '');

        const worksheet = XLSX.utils.aoa_to_sheet(lines);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Klasifikasi');
        XLSX.writeFile(workbook, 'klasifikasi-asset.xlsx', {
            bookType: 'xlsx',
        });

        toast.success('Klasifikasi asset berhasil diekspor.');
    }, [groups]);

    const handleImportFile = useCallback((file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 5 MB.');

            return;
        }

        setImportFile(file);
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const workbook = XLSX.read(reader.result, { type: 'array' });
                const sheetName = workbook.SheetNames[0];

                if (!sheetName) {
                    toast.error('File tidak memiliki sheet yang valid.');

                    return;
                }

                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
                    header: 1,
                    defval: '',
                    raw: false,
                }) as string[][];

                const rows = rowsFromSheet(data);

                if (rows.length === 0) {
                    toast.error(
                        'File tidak valid. Pastikan ada kolom level dan name.',
                    );

                    return;
                }

                setImportRows(rows);
            } catch {
                toast.error('File rusak atau tidak dapat dibaca.');
            }
        };

        reader.onerror = () => {
            toast.error('File tidak dapat dibaca.');
        };

        reader.readAsArrayBuffer(file);
    }, []);

    const runImport = useCallback(() => {
        if (!importFile || !importRows || importing) {
            return;
        }

        setImporting(true);

        const data = new FormData();
        data.append('file', importFile);

        router.post(importMethod().url, data, {
            forceFormData: true,
            only: ['groups'],
            preserveState: true,
            onSuccess: () => {
                setImporting(false);
                setImportRows(null);
                setImportFile(null);
                toast.success(`${importRows.length} baris berhasil diimpor.`);
            },
            onError: () => {
                setImporting(false);
                toast.error('Impor gagal. Periksa format dan kode unik.');
            },
        });
    }, [importFile, importRows, importing]);

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

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(62%_45%_at_8%_0%,rgba(0,128,255,0.12),transparent_60%)] dark:bg-[radial-gradient(62%_45%_at_8%_0%,rgba(90,169,236,0.15),transparent_60%)]"
                />
                <div className="mx-auto w-full max-w-7xl">
                    <div
                        className={cn(
                            'ease-premium relative transition-all duration-200',
                            isProcessing && 'pointer-events-none opacity-60',
                        )}
                    >
                        {isProcessing && (
                            <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                                <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg">
                                    <Loader2 className="size-4 animate-spin" />
                                    Memproses...
                                </div>
                            </div>
                        )}
                        <div className="card-enter flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="glass-card flex size-10 items-center justify-center rounded-xl text-primary shadow-sm">
                                    <Folder
                                        className="size-5"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                                        Klasifikasi Asset
                                    </h1>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Kelola hierarki master data: Golongan →
                                        Kategori → Cluster → Sub Cluster.
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    variant={
                                        multiSelect ? 'secondary' : 'outline'
                                    }
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
                                    onClick={() => {
                                        setMultiSelect((value) => !value);
                                        setSelectedIds(new Set());
                                    }}
                                    title={
                                        multiSelect
                                            ? 'Keluar multi-select'
                                            : 'Pilih beberapa item'
                                    }
                                >
                                    {multiSelect ? (
                                        <ListX className="size-4" />
                                    ) : (
                                        <ListChecks className="size-4" />
                                    )}
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="min-w-[180px]"
                                    >
                                        <DropdownMenuItem
                                            onClick={handleExport}
                                        >
                                            <Download className="size-4" />
                                            Ekspor Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <Upload className="size-4" />
                                            Impor Spreadsheet
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    size="sm"
                                    onClick={() => openCreate('group', null)}
                                    className="group ease-premium h-auto gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
                                >
                                    <span className="ease-premium flex size-5 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:scale-110">
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
                                    accept=".csv,.xlsx,.xls,.ods"
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
                                (level) => {
                                    const tint = LEVEL_TINTS[level];

                                    return (
                                        <div
                                            key={level}
                                            className="group ease-premium glass-card relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
                                        >
                                            <div
                                                className="absolute top-0 left-0 h-full w-1 rounded-l-xl transition-all duration-300 group-hover:w-1.5"
                                                style={{
                                                    background: tint.solid,
                                                }}
                                            />
                                            <div className="flex items-center gap-3 py-4 pr-4 pl-5">
                                                <div
                                                    className={cn(
                                                        'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                                                        tint.bg,
                                                    )}
                                                >
                                                    <LevelIcon
                                                        level={level}
                                                        size="md"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-2xl leading-none font-bold text-foreground tabular-nums">
                                                        {totals[level]}
                                                    </p>
                                                    <p className="mt-1.5 truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                        {LEVEL_SHORT[level]}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-[400px_1fr] lg:[&>*]:min-h-0">
                            <section className="glass-panel card-enter flex min-h-[400px] flex-col delay-150 lg:h-full">
                                <div className="flex min-h-[400px] flex-col overflow-hidden rounded-[0.75rem] lg:h-full">
                                    <div className="relative overflow-hidden border-b border-border/60 px-4 py-3">
                                        <div
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent dark:from-primary/[0.1]"
                                        />
                                        <div className="relative flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <h2 className="text-sm font-semibold text-foreground">
                                                    Struktur Klasifikasi
                                                </h2>
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                                    {groups.length} golongan
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground transition-colors duration-200 hover:bg-muted/80 hover:text-foreground"
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
                                                    className="size-7 text-muted-foreground transition-colors duration-200 hover:bg-muted/80 hover:text-foreground"
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

                                    <div className="border-b border-border/60 px-3 py-2.5">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={query}
                                                onChange={(event) =>
                                                    setQuery(event.target.value)
                                                }
                                                placeholder="Cari kode atau nama..."
                                                className="h-8 rounded-lg border-border/60 bg-background/80 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20"
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
                                        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
                                            <span className="text-xs font-medium text-foreground">
                                                {selectedIds.size} dipilih
                                            </span>
                                            <div className="ml-auto flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 gap-1 text-xs"
                                                    onClick={bulkDelete}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Hapus
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 gap-1 text-xs"
                                                    onClick={() => {
                                                        setSelectedIds(
                                                            new Set(),
                                                        );
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
                                        role="tree"
                                        aria-label="Klasifikasi Asset"
                                    >
                                        {groups.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                    <Inbox
                                                        className="size-7"
                                                        strokeWidth={1.25}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        Belum ada golongan asset
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Buat yang pertama untuk
                                                        memulai hierarki
                                                        klasifikasi.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openCreate(
                                                            'group',
                                                            null,
                                                        )
                                                    }
                                                    className="mt-1 gap-1.5 rounded-lg"
                                                >
                                                    <Plus className="size-3.5" />
                                                    Tambah Golongan
                                                </Button>
                                            </div>
                                        ) : visibleTree.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                                    <Search
                                                        className="size-7"
                                                        strokeWidth={1.25}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        Tidak ada hasil untuk
                                                        &ldquo;{query.trim()}
                                                        &rdquo;
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Coba kata kunci lain
                                                        atau hapus filter.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setQuery('')}
                                                    className="mt-1 gap-1.5 rounded-lg"
                                                >
                                                    <X className="size-3.5" />
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
                                                    deletingId={deletingId}
                                                    onSelect={(id) =>
                                                        multiSelect
                                                            ? toggleMultiSelectItem(
                                                                  id,
                                                              )
                                                            : setSelectedId(id)
                                                    }
                                                    onToggleExpand={
                                                        toggleExpand
                                                    }
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
                                                    onDuplicate={
                                                        handleDuplicate
                                                    }
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
                                                                id: node.node
                                                                    .id,
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
                                                                id: node.node
                                                                    .id,
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
                                                                id: node.node
                                                                    .id,
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

                            <section className="glass-panel card-enter flex min-h-[400px] flex-col delay-200 lg:h-full">
                                <div className="flex min-h-[400px] flex-col overflow-hidden rounded-[0.75rem] lg:h-full">
                                    {selectedInfo ? (
                                        <ClassificationDetailPanel
                                            level={selectedInfo.level}
                                            node={selectedInfo.node}
                                            ancestors={selectedAncestors}
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
                                                handleDuplicate(
                                                    selectedInfo.node,
                                                )
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
                                        <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <FolderOpen
                                                    className="size-7"
                                                    strokeWidth={1.25}
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-semibold text-foreground">
                                                    Pilih node dari pohon
                                                    klasifikasi
                                                </h2>
                                                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                                    Klik golongan, kategori,
                                                    cluster, atau sub cluster
                                                    untuk melihat detailnya.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
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
                            disabled={deletingId === deleteState?.item.id}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletingId === deleteState?.item.id}
                        >
                            {deletingId === deleteState?.item.id ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={importRows !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setImportRows(null);
                        setImportFile(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Impor Klasifikasi Asset</DialogTitle>
                        <DialogDescription>
                            {importRows
                                ? `${importRows.length} baris siap diimpor dari file spreadsheet. Kode parent harus mengacu ke baris yang sudah ada atau berada di file yang sama.`
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
                            onClick={() => {
                                setImportRows(null);
                                setImportFile(null);
                            }}
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

AssetClassification.layout = {
    breadcrumbs: [
        {
            title: 'Klasifikasi Asset',
            href: index().url,
        },
    ],
};
