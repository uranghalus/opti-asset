import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    storeCategory,
    storeCluster,
    storeGroup,
    storeSubCluster,
    updateCategory,
    updateCluster,
    updateGroup,
    updateSubCluster,
} from '@/actions/App/Http/Controllers/AssetClassificationController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    ClassificationFormValues,
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { LEVEL_LABELS, TIPE_LABELS } from '@/types/classification';

type RouteFn = (id: string) => { url: string; method: string };
type StoreRouteFn = () => { url: string; method: string };

const STORE: Record<ClassificationLevel, StoreRouteFn> = {
    group: storeGroup,
    category: storeCategory,
    cluster: storeCluster,
    'sub-cluster': storeSubCluster,
};

const UPDATE: Record<ClassificationLevel, RouteFn> = {
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

const TIPE_OPTIONS = ['peralatan', 'aktiva_tetap'] as const;

type FormProps = {
    level: ClassificationLevel;
    parentId: string | null;
    parentName: string | null;
    parentType: string | null;
    item: ClassificationNode | null;
    onClose: () => void;
};

export function ClassificationForm({
    level,
    parentId,
    parentName,
    parentType,
    item,
    onClose,
}: FormProps) {
    const isEditing = item !== null;
    const parentField = PARENT_FIELD[level];

    const form = useForm<ClassificationFormValues>({
        code: item?.code ?? '',
        name: item?.name ?? '',
        description: item?.description ?? '',
        notes: item?.notes ?? '',
        classification_type:
            level === 'group' ? (item?.classification_type ?? '') : (parentType ?? ''),
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            only: ['groups'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                toast.success(
                    isEditing
                        ? `${LEVEL_LABELS[level]} berhasil diperbarui.`
                        : `${LEVEL_LABELS[level]} berhasil ditambahkan.`,
                );
            },
        };

        // Moves happen via reorder only: the PATCH validators whitelist
        // code/name/description/notes, so the parent id and tipe are sent on
        // create (where the store validators require them) but never on
        // update — a node's type is immutable after creation.
        form.transform((data) => ({
            code: data.code || null,
            name: data.name,
            description: data.description || null,
            ...(!isEditing && parentField ? { [parentField]: parentId } : {}),
            ...(!isEditing
                ? {
                      classification_type:
                          level === 'group'
                              ? (data.classification_type || null)
                              : (parentType || null),
                  }
                : {}),
            ...(level === 'sub-cluster' ? { notes: data.notes || null } : {}),
        }));

        if (isEditing) {
            form.patch(UPDATE[level](item.id).url, options);
        } else {
            form.post(STORE[level]().url, options);
        }
    };

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {isEditing
                            ? `Edit ${LEVEL_LABELS[level]}`
                            : `Tambah ${LEVEL_LABELS[level]}`}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? `Perbarui informasi ${LEVEL_LABELS[level].toLowerCase()}.`
                            : `Buat ${LEVEL_LABELS[level].toLowerCase()} baru pada struktur klasifikasi.`}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                        {parentField && (
                            <div className="grid gap-2">
                                <Label>Parent</Label>
                                <Input value={parentName ?? ''} disabled />
                            </div>
                        )}

                        {!isEditing && level === 'group' && (
                            <div className="grid gap-2">
                                <Label>Tipe Klasifikasi</Label>
                                <div
                                    role="radiogroup"
                                    aria-label="Tipe Klasifikasi"
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {TIPE_OPTIONS.map((tipe) => {
                                        const selected =
                                            form.data.classification_type ===
                                            tipe;

                                        return (
                                            <button
                                                key={tipe}
                                                type="button"
                                                role="radio"
                                                aria-checked={selected}
                                                onClick={() =>
                                                    form.setData(
                                                        'classification_type',
                                                        tipe,
                                                    )
                                                }
                                                className={cn(
                                                    'flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors duration-150',
                                                    selected
                                                        ? 'border-primary-muted-border bg-primary-muted text-primary'
                                                        : 'border-border bg-surface-sunken text-ink-muted hover:border-border-strong hover:text-foreground',
                                                )}
                                            >
                                                {TIPE_LABELS[tipe]}
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.errors.classification_type && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.classification_type}
                                    </p>
                                )}
                            </div>
                        )}

                        {!isEditing && level !== 'group' && (
                            <div className="grid gap-2">
                                <Label>Tipe Klasifikasi</Label>
                                <Input
                                    value={
                                        parentType
                                            ? (TIPE_LABELS[parentType] ??
                                              parentType)
                                            : ''
                                    }
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tipe mengikuti induk — node baru berada di
                                    dalam pohon yang sama.
                                </p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="classification-code">Kode</Label>
                            <Input
                                id="classification-code"
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
                            <p className="text-xs text-muted-foreground">
                                Opsional, maksimal 20 karakter.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="classification-name">Nama</Label>
                            <Input
                                id="classification-name"
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
                            <Label htmlFor="classification-description">
                                Deskripsi
                            </Label>
                            <Textarea
                                id="classification-description"
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
                                <Label htmlFor="classification-notes">
                                    Keterangan
                                </Label>
                                <Textarea
                                    id="classification-notes"
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
                    </div>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="ease-premium rounded-lg transition-all duration-200 active:scale-[0.98]"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="ease-premium rounded-lg transition-all duration-200 active:scale-[0.98]"
                        >
                            {form.processing ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : null}
                            Simpan
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
