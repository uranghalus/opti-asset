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
                'rounded-xl border border-white/20 bg-card/90 p-2.5 pl-4 backdrop-blur-xl',
                'shadow-[0_18px_44px_-12px_rgba(0,0,0,0.35)]',
                'bottom-[calc(4rem+env(safe-area-inset-bottom))]',
                'lg:sticky lg:bottom-6 lg:mx-auto lg:w-fit lg:min-w-[420px]',
            )}
        >
            <span className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-foreground">
                <span
                    aria-hidden
                    className="barcode-strip h-6 w-10 shrink-0 text-muted-foreground/50"
                />
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-[13px] font-bold text-primary-foreground tabular-nums">
                    {selectedCount}
                </span>
                <span className="truncate">pos dipilih</span>
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
                    onClick={onBulkDelete}
                    aria-label="Hapus semua yang dipilih"
                    className="h-10 gap-2 rounded-md bg-red-500 px-4 font-semibold text-white hover:bg-red-400"
                >
                    <Trash2 className="size-4" />
                    Hapus
                </Button>
            </span>
        </div>
    );
}
