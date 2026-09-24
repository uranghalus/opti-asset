import { Link } from '@inertiajs/react';
import { MoreHorizontal, Plus, ScanLine, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCan } from '@/hooks/use-can';
import { withReturnTo } from '@/lib/asset-return';
import { cn } from '@/lib/utils';
import { create, importTemplate, labelsBatch, scan } from '@/routes/assets';

/**
 * Header halaman Aset — satu baris identitas + hitungan, satu baris aksi.
 * Semua handler tidak berubah.
 */
export function AssetsPageHeader({
    selectedCount,
    total,
    activeFilterCount,
    contextLabel,
    onToggleDrawer,
    onOpenImport,
}: {
    selectedCount: number;
    total: number;
    activeFilterCount: number;
    contextLabel: string | null;
    onToggleDrawer: () => void;
    onOpenImport: () => void;
}) {
    const { can } = useCan();
    const canCreate = can('asset.create');

    return (
        <header
            aria-label="Kendali aset"
            className={cn(
                'rounded-xl border border-border bg-card',
                'shadow-[var(--shadow-sticky)]',
            )}
        >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        {contextLabel ?? 'Semua aset'}
                    </p>
                    <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.02em] text-foreground">
                        Aset
                    </h1>
                    <p
                        aria-live="polite"
                        className="mt-1 text-sm text-muted-foreground"
                    >
                        <span className="font-semibold text-foreground tabular-nums">
                            {total}
                        </span>{' '}
                        aset
                        {activeFilterCount > 0 &&
                            ` · ${activeFilterCount} filter aktif`}
                        {selectedCount > 0 && ` · ${selectedCount} dipilih`}
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={onToggleDrawer}
                        className="lg:hidden"
                    >
                        Indeks klasifikasi
                    </Button>

                    <Link href={scan.url()}>
                        <Button
                            variant="outline"
                            aria-label="Pindai barcode aset"
                        >
                            <ScanLine className="size-4 text-primary" />
                            Pindai
                        </Button>
                    </Link>

                    {canCreate && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Aksi lainnya"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="min-w-[220px]"
                            >
                                <DropdownMenuLabel>Impor</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        window.open(
                                            importTemplate.url(),
                                            '_blank',
                                        )
                                    }
                                >
                                    <UploadCloud className="size-4" />
                                    Unduh template
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onOpenImport}>
                                    <UploadCloud className="size-4" />
                                    Import spreadsheet
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>
                                    Label barcode
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    disabled={selectedCount === 0}
                                >
                                    Cetak yang dipilih
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={labelsBatch.url()}
                                        className="flex items-center gap-2"
                                    >
                                        Cetak massal
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {canCreate && (
                        <Link href={withReturnTo(create.url())}>
                            <Button className="gap-2 px-4 font-semibold">
                                <Plus className="size-4" />
                                Tambah aset
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
