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
            <div className="relative overflow-hidden bg-[#00175A] p-4 text-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_100%_0%,rgba(90,169,236,0.3),transparent_60%)]"
                />
                <div className="relative flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: tint.solid }}
                            aria-hidden
                        />
                        <span className="inline-flex shrink-0 items-center rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {LEVEL_LABELS[level]}
                        </span>
                        {node.code && (
                            <span className="inline-flex shrink-0 items-center rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/80">
                                {node.code}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="ease-premium text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white"
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

                <div className="mb-6 flex items-start gap-3">
                    <LevelIcon level={level} open />
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            {node.name}
                        </h2>
                        {node.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {node.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                    <div
                        className={cn(
                            'ease-premium rounded-xl p-3 transition-all duration-300 hover:-translate-y-0.5',
                            tint.bg,
                        )}
                    >
                        <p
                            className={cn(
                                'text-[11px] font-medium tracking-wide uppercase',
                                tint.fg,
                            )}
                        >
                            {level === 'sub-cluster' ? 'Aset' : 'Anak'}
                        </p>
                        <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">
                            {level === 'sub-cluster'
                                ? (node.item_count ?? 0)
                                : node.child_count}
                        </p>
                    </div>
                    <div
                        className={cn(
                            'ease-premium rounded-xl p-3 transition-all duration-300 hover:-translate-y-0.5',
                            tint.bg,
                        )}
                    >
                        <p
                            className={cn(
                                'text-[11px] font-medium tracking-wide uppercase',
                                tint.fg,
                            )}
                        >
                            Level
                        </p>
                        <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">
                            {LEVEL_ORDER.indexOf(level) + 1}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {canAddChild && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onAddChild(childLevel)}
                            className="ease-premium rounded-full bg-[#006FCF] text-white shadow-[0_10px_28px_-12px_rgba(0,111,207,0.6)] transition-all duration-300 hover:bg-[#1374D4] active:scale-[0.98] active:bg-[#00509E] dark:bg-[#006FCF] dark:text-white dark:hover:bg-[#1374D4]"
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
                        className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                    >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onDuplicate}
                        className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                    >
                        <Copy className="size-3.5" strokeWidth={1.75} />
                        Duplikat
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ease-premium rounded-full text-destructive transition-all duration-300 hover:text-destructive active:scale-[0.98]"
                        onClick={onDelete}
                    >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                        Hapus
                    </Button>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span
                            className="size-1.5 rounded-full"
                            style={{ background: tint.solid }}
                            aria-hidden
                        />
                        Detail Informasi
                    </h3>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="detail-code">Kode</Label>
                            <Input
                                id="detail-code"
                                value={form.data.code}
                                onChange={(event) =>
                                    form.setData('code', event.target.value)
                                }
                                placeholder="Contoh: 01.02"
                                maxLength={20}
                            />
                            {form.errors.code && (
                                <p className="text-xs text-destructive">
                                    {form.errors.code}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="detail-name">Nama</Label>
                            <Input
                                id="detail-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Nama klasifikasi"
                                required
                            />
                            {form.errors.name && (
                                <p className="text-xs text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="detail-description">
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
                            />
                            {form.errors.description && (
                                <p className="text-xs text-destructive">
                                    {form.errors.description}
                                </p>
                            )}
                        </div>

                        {level === 'sub-cluster' && (
                            <div className="grid gap-2">
                                <Label htmlFor="detail-notes">Keterangan</Label>
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
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || !form.isDirty}
                                className="ease-premium rounded-full transition-all duration-300 active:scale-[0.98]"
                            >
                                {form.processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
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
