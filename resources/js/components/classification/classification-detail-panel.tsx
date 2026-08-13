import { useForm } from '@inertiajs/react';
import {
    Save,
    X,
    Trash2,
    Copy,
    Plus,
    ChevronRight,
    Loader2,
    Pencil,
} from 'lucide-react';
import { Fragment } from 'react';
import { toast } from 'sonner';
import {
    updateCategory,
    updateCluster,
    updateGroup,
    updateSubCluster,
} from '@/actions/App/Http/Controllers/AssetClassificationController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LevelIcon, LEVEL_TINTS } from '@/lib/classification-levels';
import { cn } from '@/lib/utils';
import type {
    ClassificationFormValues,
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { LEVEL_LABELS } from '@/types/classification';

type ItemRouteFn = (id: string) => { url: string; method: string };

const UPDATE: Record<ClassificationLevel, ItemRouteFn> = {
    group: updateGroup,
    category: updateCategory,
    cluster: updateCluster,
    'sub-cluster': updateSubCluster,
};

const PARENT_FIELD: Partial<Record<ClassificationLevel, string>> = {
    category: 'asset_group_id',
    cluster: 'asset_category_id',
    'sub-cluster': 'asset_cluster_id',
};

const CHILD_LABEL: Partial<Record<ClassificationLevel, string>> = {
    group: 'Kategori',
    category: 'Cluster',
    cluster: 'Sub Cluster',
};

const LEVEL_ORDER: ClassificationLevel[] = [
    'group',
    'category',
    'cluster',
    'sub-cluster',
];

type DetailProps = {
    level: ClassificationLevel;
    node: ClassificationNode;
    ancestors: ClassificationNode[];
    parentId: string | null;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onAddChild: (level: ClassificationLevel) => void;
    onClose: () => void;
};

export function ClassificationDetailPanel({
    level,
    node,
    ancestors,
    parentId,
    onEdit,
    onDelete,
    onDuplicate,
    onAddChild,
    onClose,
}: DetailProps) {
    const parentField = PARENT_FIELD[level];
    const tint = LEVEL_TINTS[level];

    const form = useForm<ClassificationFormValues>({
        code: node.code ?? '',
        name: node.name,
        description: node.description ?? '',
        notes: node.notes ?? '',
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            code: data.code || null,
            name: data.name,
            description: data.description || null,
            ...(parentField ? { [parentField]: parentId } : {}),
            ...(level === 'sub-cluster' ? { notes: data.notes || null } : {}),
        }));

        form.patch(UPDATE[level](node.id).url, {
            only: ['groups'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${LEVEL_LABELS[level]} berhasil diperbarui.`);
            },
        });
    };

    const childLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1];
    const canAddChild = childLevel !== undefined;

    const crumbs: {
        label: string;
        level: ClassificationLevel;
        active?: boolean;
    }[] = [
        { label: LEVEL_LABELS.group, level: LEVEL_ORDER[0] },
        ...ancestors.map((ancestor, index) => ({
            label: ancestor.name,
            level: LEVEL_ORDER[index + 1],
        })),
        {
            label: node.name,
            level: LEVEL_ORDER[ancestors.length],
            active: true,
        },
    ];

    return (
        <div className="flex h-full flex-col">
            <div className="relative overflow-hidden border-b border-border/60 px-4 py-3">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent dark:from-primary/[0.1]"
                />
                <div className="relative flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <LevelIcon level={level} size="sm" />
                        <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            {LEVEL_LABELS[level]}
                        </span>
                        {node.code && (
                            <span className="inline-flex shrink-0 items-center rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                                {node.code}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="size-7 text-muted-foreground transition-colors duration-150 hover:bg-muted/80 hover:text-foreground"
                        aria-label="Tutup panel"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <nav
                    className="mb-4 flex flex-wrap items-center gap-1 text-xs"
                    aria-label="Jalur klasifikasi"
                >
                    {crumbs.map((crumb, index) => (
                        <Fragment key={`${crumb.label}-${index}`}>
                            <span
                                className={cn(
                                    'inline-flex items-center rounded px-1.5 py-0.5',
                                    LEVEL_TINTS[crumb.level].bg,
                                    LEVEL_TINTS[crumb.level].fg,
                                    crumb.active && 'font-semibold',
                                )}
                            >
                                {crumb.label}
                            </span>
                            {index < crumbs.length - 1 && (
                                <ChevronRight className="size-3 text-muted-foreground" />
                            )}
                        </Fragment>
                    ))}
                </nav>

                <div className="mb-5">
                    <h2 className="text-base font-bold text-foreground">
                        {node.name}
                    </h2>
                    {node.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {node.description}
                        </p>
                    )}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-2.5">
                    <div
                        className={cn(
                            'rounded-xl p-3.5 transition-colors',
                            tint.bg,
                        )}
                    >
                        <p
                            className={cn(
                                'text-[10px] font-semibold tracking-wider uppercase',
                                tint.fg,
                            )}
                        >
                            {level === 'sub-cluster' ? 'Aset' : 'Anak'}
                        </p>
                        <p className="mt-1 text-xl font-bold text-foreground tabular-nums">
                            {level === 'sub-cluster'
                                ? (node.item_count ?? 0)
                                : node.child_count}
                        </p>
                    </div>
                    <div
                        className={cn(
                            'rounded-xl p-3.5 transition-colors',
                            tint.bg,
                        )}
                    >
                        <p
                            className={cn(
                                'text-[10px] font-semibold tracking-wider uppercase',
                                tint.fg,
                            )}
                        >
                            Level
                        </p>
                        <p className="mt-1 text-xl font-bold text-foreground tabular-nums">
                            {LEVEL_ORDER.indexOf(level) + 1}
                        </p>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-1.5">
                    {canAddChild && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onAddChild(childLevel)}
                            className="gap-1.5 rounded-lg bg-primary px-3 text-primary-foreground shadow-sm"
                        >
                            <Plus className="size-3.5" strokeWidth={2} />
                            Tambah {CHILD_LABEL[level]}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="gap-1.5 rounded-lg"
                    >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onDuplicate}
                        className="gap-1.5 rounded-lg"
                    >
                        <Copy className="size-3.5" strokeWidth={1.75} />
                        Duplikat
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                        Hapus
                    </Button>
                </div>

                <div className="border-t border-border/60 pt-5">
                    <h3 className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Detail Informasi
                    </h3>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3.5"
                    >
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="detail-code"
                                className="text-xs text-muted-foreground"
                            >
                                Kode
                            </Label>
                            <Input
                                id="detail-code"
                                value={form.data.code}
                                onChange={(event) =>
                                    form.setData('code', event.target.value)
                                }
                                placeholder="Contoh: 01.02"
                                maxLength={20}
                                className="h-9 text-sm"
                            />
                            {form.errors.code && (
                                <p className="text-xs text-destructive">
                                    {form.errors.code}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="detail-name"
                                className="text-xs text-muted-foreground"
                            >
                                Nama
                            </Label>
                            <Input
                                id="detail-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Nama klasifikasi"
                                required
                                className="h-9 text-sm"
                            />
                            {form.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="detail-description"
                                className="text-xs text-muted-foreground"
                            >
                                Deskripsi
                            </Label>
                            <Textarea
                                id="detail-description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Deskripsi singkat (opsional)"
                                className="min-h-[80px] text-sm"
                            />
                            {form.errors.description && (
                                <p className="text-xs text-destructive">
                                    {form.errors.description}
                                </p>
                            )}
                        </div>

                        {level === 'sub-cluster' && (
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="detail-notes"
                                    className="text-xs text-muted-foreground"
                                >
                                    Keterangan
                                </Label>
                                <Textarea
                                    id="detail-notes"
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Keterangan tambahan (opsional)"
                                    className="min-h-[80px] text-sm"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="rounded-lg"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={form.processing || !form.isDirty}
                                className="gap-1.5 rounded-lg"
                            >
                                {form.processing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Save className="size-3.5" />
                                )}
                                Simpan
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
