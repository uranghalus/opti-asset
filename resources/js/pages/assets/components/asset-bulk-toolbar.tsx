import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Slip pilihan kaca — struk melayang saat ada pos terpilih,
 * berisi cap hitungan dan dua aksi: batalkan atau hapus massal.
 */
export function AssetBulkToolbar({
    selectedCount,
    onClear,
    onBulkDelete,
}: {
    selectedCount: number;
    onClear: () => void;
    onBulkDelete: () => void;
}) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div
            role="toolbar"
            aria-label="Aksi pilihan massal"
            className={cn(
                'stamp-slam fixed inset-x-3 z-40 flex items-center justify-between gap-3',
                'rounded-xl border border-border bg-card p-2.5 pl-4',
                'shadow-[var(--shadow-overlay)]',
                'bottom-[calc(56px+env(safe-area-inset-bottom))]',
                'lg:sticky lg:bottom-6 lg:mx-auto lg:w-fit lg:min-w-[420px]',
            )}
        >
            <span className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-foreground">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                    {selectedCount}
                </span>
                <span className="truncate">aset dipilih</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    aria-label="Batalkan pilihan"
                    className="size-10 rounded-md hover:bg-muted"
                >
                    <X className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    onClick={onBulkDelete}
                    aria-label="Hapus semua yang dipilih"
                    className="h-10 gap-2 px-4 font-semibold"
                >
                    <Trash2 className="size-4" />
                    Hapus
                </Button>
            </span>
        </div>
    );
}
