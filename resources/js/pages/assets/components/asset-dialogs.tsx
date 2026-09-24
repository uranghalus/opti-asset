import { router } from '@inertiajs/react';
import { Check, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { destroy, destroyBulk, importMethod } from '@/routes/assets';
import type { Asset } from './types';

/**
 * Cap peringatan hapus — surat perintah kaca dengan kode pos
 * yang dibatalkan dari manifest. Alur hapus tidak berubah.
 */
export function AssetDeleteDialog({
    asset,
    onClose,
}: {
    asset: Asset | null;
    onClose: () => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        if (!asset) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url({ asset: asset.id }), {
            only: ['assets', 'tree', 'selected', 'breadcrumb'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(false);
                onClose();
                toast.success('Aset dihapus.');
            },
            onError: () => {
                setDeleting(false);
                toast.error('Gagal menghapus. Coba lagi.');
            },
        });
    };

    return (
        <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-6">
                <DialogHeader>
                    <span className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                        <TriangleAlert className="size-5" />
                    </span>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Hapus aset ini?
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Aset{' '}
                    <strong className="font-mono font-bold text-foreground">
                        {asset?.kode_asset}
                    </strong>{' '}
                    akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
                <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={deleting}
                        className=""
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-md font-semibold"
                    >
                        {deleting && <Spinner className="mr-2 size-4" />}
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AssetBulkDeleteDialog({
    open,
    count,
    selectedIds,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    count: number;
    selectedIds: string[];
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}) {
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const handleConfirm = () => {
        if (!open) {
            return;
        }

        setBulkDeleting(true);

        router.delete(destroyBulk.url(), {
            data: { ids: selectedIds },
            only: ['assets', 'tree', 'selected', 'breadcrumb'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setBulkDeleting(false);
                onOpenChange(false);
                onSuccess();
                toast.success(`${count} aset dihapus.`);
            },
            onError: () => {
                setBulkDeleting(false);
                toast.error('Gagal hapus massal. Coba lagi.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-6">
                <DialogHeader>
                    <span className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                        <TriangleAlert className="size-5" />
                    </span>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Hapus {count} aset?
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Semua aset yang dipilih akan dihapus permanen. Tindakan ini
                    tidak dapat dibatalkan.
                </DialogDescription>
                <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={bulkDeleting}
                        className=""
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={bulkDeleting}
                        className="rounded-md font-semibold"
                    >
                        {bulkDeleting && <Spinner className="mr-2 size-4" />}
                        Hapus Semua
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AssetImportDialog({
    open,
    items,
    onClose,
}: {
    open: boolean;
    items: Array<{ id: string; code: string; name: string }>;
    onClose: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [itemId, setItemId] = useState('');
    const [importing, setImporting] = useState(false);

    const handleImport = () => {
        if (!file || importing) {
            return;
        }

        setImporting(true);

        const d = new FormData();
        d.append('file', file);

        if (itemId) {
            d.append('item_id', itemId);
        }

        router.post(importMethod.url(), d, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setImporting(false);
                onClose();
                setFile(null);
                setItemId('');
                toast.success('Aset berhasil diimpor.');
            },
            onError: () => {
                setImporting(false);
                toast.error('Gagal impor. Periksa format berkas.');
            },
        });
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 dark:bg-background/80">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-overlay)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">
                            Impor aset
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                            Import dari spreadsheet
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Unggah berkas untuk mencatat banyak aset sekaligus.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        aria-label="Tutup"
                    >
                        <svg
                            className="size-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <div>
                        <label
                            htmlFor="import-file"
                            className="mb-1.5 block text-sm font-medium text-foreground"
                        >
                            Berkas spreadsheet
                        </label>
                        <Input
                            id="import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="h-10 rounded-md text-sm"
                        />
                    </div>

                    {items.length > 0 && (
                        <div>
                            <label
                                htmlFor="import-item"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Item bawaan (opsional)
                            </label>
                            <select
                                id="import-item"
                                value={itemId}
                                onChange={(e) => setItemId(e.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
                            >
                                <option value="">— Pilih item —</option>
                                {items.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.code} — {i.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {file && (
                        <div className="flex items-center gap-2 rounded-md border border-status-act-border bg-status-act-bg px-3 py-2.5 text-sm text-status-act-text">
                            <Check className="size-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate font-medium">
                                {file.name}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={importing}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="flex-1 font-semibold"
                    >
                        {importing && <Spinner className="mr-2 size-4" />}
                        Import
                    </Button>
                </div>
            </div>
        </div>
    );
}
