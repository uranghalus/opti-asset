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
                toast.success('Aset dihapus dari manifest.');
            },
            onError: () => {
                setDeleting(false);
                toast.error('Gagal menghapus. Coba lagi.');
            },
        });
    };

    return (
        <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="rounded-lg border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/85">
                <DialogHeader>
                    <span className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                        <TriangleAlert className="size-5" />
                    </span>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Batalkan pos dari manifest?
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Pos{' '}
                    <strong className="font-mono font-bold text-foreground">
                        {asset?.kode_asset}
                    </strong>{' '}
                    akan dihapus permanen. Perintah ini tidak dapat dibatalkan.
                </DialogDescription>
                <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-md border-white/20 bg-white/10 hover:bg-white/20"
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
                        Hapus Pos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AssetBulkDeleteDialog({
    open,
    count,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    count: number;
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
            data: { ids: [] },
            only: ['assets', 'tree', 'selected', 'breadcrumb'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setBulkDeleting(false);
                onOpenChange(false);
                onSuccess();
                toast.success(`${count} pos dibatalkan dari manifest.`);
            },
            onError: () => {
                setBulkDeleting(false);
                toast.error('Gagal hapus massal. Coba lagi.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-lg border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/85">
                <DialogHeader>
                    <span className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                        <TriangleAlert className="size-5" />
                    </span>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Batalkan {count} pos?
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Semua pos yang dipilih akan dihapus permanen dari manifest.
                    Perintah ini tidak dapat dibatalkan.
                </DialogDescription>
                <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={bulkDeleting}
                        className="rounded-md border-white/20 bg-white/10 hover:bg-white/20"
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
                toast.success('Pos impor tercatat di manifest.');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/85">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-mono text-[13px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                            Lampiran manifest
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                            Impor Pos Massal
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Unggah lembar kerja untuk mencatat banyak pos
                            sekaligus.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
                            htmlFor="manifest-import-file"
                            className="mb-1.5 block text-sm font-medium text-foreground"
                        >
                            Berkas lembar kerja
                        </label>
                        <Input
                            id="manifest-import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="h-10 rounded-md border-white/20 bg-white/10 text-sm backdrop-blur-sm"
                        />
                    </div>

                    {items.length > 0 && (
                        <div>
                            <label
                                htmlFor="manifest-import-item"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Item bawaan (opsional)
                            </label>
                            <select
                                id="manifest-import-item"
                                value={itemId}
                                onChange={(e) => setItemId(e.target.value)}
                                className="h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm text-foreground backdrop-blur-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-none"
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
                        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
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
                        className="flex-1 rounded-md border-white/20 bg-white/10 hover:bg-white/20"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="flex-1 rounded-md bg-primary font-bold text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_24px_-6px_var(--primary)]"
                    >
                        {importing && <Spinner className="mr-2 size-4" />}
                        Catat ke Manifest
                    </Button>
                </div>
            </div>
        </div>
    );
}
