import { Link } from '@inertiajs/react';
import {
    Barcode,
    Download,
    Layers,
    MoreHorizontal,
    Plus,
    ScanLine,
    UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { withReturnTo } from '@/lib/asset-return';
import { cn } from '@/lib/utils';
import { create, importTemplate, labelsBatch, scan } from '@/routes/assets';

/**
 * Command deck halaman Aset — panel kaca di atas lembar kerja.
 * Identitas manifest, garis meta ledger, dan kunci aksi primary
 * Electric Blue sesuai DESIGN.md. Semua handler tidak berubah.
 */
export function AssetsPageHeader({
    initialLevel,
    selectedCount,
    total,
    activeFilterCount,
    contextLabel,
    onToggleDrawer,
    onOpenImport,
}: {
    initialLevel: string;
    selectedCount: number;
    total: number;
    activeFilterCount: number;
    contextLabel: string | null;
    onToggleDrawer: () => void;
    onOpenImport: () => void;
}) {
    return (
        <header
            aria-label="Pusat kendali aset"
            className={cn(
                'overflow-hidden rounded-xl border border-white/20 bg-white/10',
                'shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-lg',
            )}
        >
            {/* Baris utama deck */}
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                    <div
                        aria-hidden
                        className="flex h-12 w-11 shrink-0 flex-col justify-between rounded-md bg-primary p-1.5 text-primary-foreground"
                    >
                        <Barcode className="size-4" strokeWidth={2.5} />
                        <span className="barcode-strip block h-3.5 w-full opacity-80" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[2rem] font-bold tracking-[-0.02em] text-foreground">
                            Manifest Aset
                        </h1>
                        <p
                            aria-live="polite"
                            className="mt-1 truncate font-mono text-[13px] tracking-wide text-muted-foreground tabular-nums"
                        >
                            {total} POS · {activeFilterCount} SARINGAN ·{' '}
                            {selectedCount} TERPILIH
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleDrawer}
                        className="rounded-md border-white/20 bg-white/10 backdrop-blur-sm lg:hidden"
                    >
                        <Layers className="size-4" />
                        Indeks
                    </Button>

                    <Link href={scan.url()}>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Pindai barcode aset"
                            className="size-10 rounded-md border-white/20 bg-white/10 backdrop-blur-sm"
                        >
                            <ScanLine className="size-4 text-primary" />
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Aksi manifest lainnya"
                                className="size-10 rounded-md border-white/20 bg-white/10 backdrop-blur-sm"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="min-w-[220px]"
                        >
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(importTemplate.url(), '_blank')
                                }
                            >
                                <Download className="size-4" />
                                Template Import
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onOpenImport}>
                                <UploadCloud className="size-4" />
                                Import Spreadsheet
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={selectedCount === 0}
                                onClick={() => {
                                    if (selectedCount > 0) {
                                        // Handled by parent via router.visit
                                    }
                                }}
                            >
                                <Barcode className="size-4" />
                                Cetak Barcode
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={labelsBatch.url()}
                                    className="flex items-center gap-2"
                                >
                                    <Layers className="size-4" />
                                    Cetak Massal
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href={withReturnTo(create.url())}>
                        <Button
                            size="sm"
                            className="gap-2 rounded-md px-4 py-2.5 font-semibold hover:shadow-[0_0_24px_-6px_var(--primary)]"
                        >
                            <Plus className="size-3.5" />
                            Tambah Aset
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Strip konteks posisi drill-down */}
            <div className="flex items-center gap-3 border-t border-white/10 px-4 py-2.5 sm:px-5">
                <span
                    aria-hidden
                    className="barcode-strip h-4 w-16 shrink-0 text-muted-foreground/40"
                />
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                    {contextLabel ?? 'Semua Aset'}
                    <span className="mx-2 text-muted-foreground/50">/</span>
                    <span className="text-muted-foreground/70">
                        {initialLevel === 'group'
                            ? 'mulai dari Golongan'
                            : 'mulai dari Cluster'}
                    </span>
                </p>
            </div>
        </header>
    );
}
