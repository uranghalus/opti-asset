import { useForm } from '@inertiajs/react';
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
import type {
    ClassificationFormValues,
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';
import { LEVEL_LABELS } from '@/types/classification';

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

type FormProps = {
    level: ClassificationLevel;
    parentId: string | null;
    parentName: string | null;
    item: ClassificationNode | null;
    onClose: () => void;
};

export function ClassificationForm({
    level,
    parentId,
    parentName,
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

        form.transform((data) => ({
            code: data.code || null,
            name: data.name,
            description: data.description || null,
            ...(parentField ? { [parentField]: parentId } : {}),
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
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Simpan
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
