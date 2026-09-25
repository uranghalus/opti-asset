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
import { LEVEL_SHORT } from '@/lib/classification-levels';
import {
    create,
    importTemplate,
    labels,
    labelsBatch,
    scan,
} from '@/routes/assets';
import type { ClassificationLevel } from '@/types/classification';

type Crumb = {
    id: string;
    level: ClassificationLevel;
    code: string | null;
    name: string;
};

/**
 * Kepala halaman Aset — identitas scope sekali di sini (ADR 0001):
 * induk scope sebagai eyebrow, node aktif sebagai H1 (+ kode mono + label
 * level). Baris kedua = hitungan hasil, bukan pengulangan scope.
 * Navigasi/import tidak berubah.
 */
export function AssetsPageHeader({
    selectedCount,
    selectedIds,
    total,
    activeFilterCount,
    breadcrumb,
    scopeNode,
    descendantFallback,
    onToggleDrawer,
    onOpenImport,
}: {
    selectedCount: number;
    selectedIds: string[];
    total: number;
    activeFilterCount: number;
    breadcrumb: Crumb[];
    scopeNode: {
        level: ClassificationLevel;
        name: string;
        code: string | null;
    } | null;
    descendantFallback: boolean;
    onToggleDrawer: () => void;
    onOpenImport: () => void;
}) {
    const { can } = useCan();
    const canCreate = can('asset.create');
    const parents = breadcrumb.slice(0, -1);
    const scopeCode = scopeNode?.code ?? null;
    const scopeLevelLabel = scopeNode ? LEVEL_SHORT[scopeNode.level] : null;

    return (
        <header
            aria-label="Kendali aset"
            className="rounded-xl border border-border bg-card shadow-[var(--shadow-sticky)]"
        >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    {parents.length > 0 ? (
                        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs font-medium tracking-wide text-muted-foreground">
                            {parents.map((c, i) => (
                                <span
                                    key={c.id}
                                    className="inline-flex min-w-0 items-center gap-1.5"
                                >
                                    {i > 0 && (
                                        <span
                                            aria-hidden
                                            className="text-muted-foreground/50"
                                        >
                                            /
                                        </span>
                                    )}
                                    <span className="truncate">{c.name}</span>
                                </span>
                            ))}
                        </p>
                    ) : (
                        <p className="text-xs font-medium tracking-wide text-muted-foreground">
                            Semua aset
                        </p>
                    )}
                    <h1 className="mt-0.5 flex min-w-0 items-baseline gap-2 text-2xl font-bold tracking-[-0.02em] text-foreground">
                        <span className="truncate">
                            {scopeNode?.name ?? 'Aset'}
                        </span>
                        {scopeCode && (
                            <span className="shrink-0 rounded-md bg-surface-sunken px-1.5 py-0.5 font-mono text-sm font-semibold text-ink-muted dark:bg-muted dark:text-muted-foreground">
                                {scopeCode}
                            </span>
                        )}
                        {scopeLevelLabel && (
                            <span className="shrink-0 text-sm font-medium text-muted-foreground">
                                {scopeLevelLabel}
                            </span>
                        )}
                    </h1>
                    <p
                        aria-live="polite"
                        className="mt-1 text-sm text-muted-foreground"
                    >
                        <span className="font-semibold text-foreground tabular-nums">
                            {total}
                        </span>{' '}
                        aset
                        {descendantFallback && (
                            <span className="ml-2 rounded-sm bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-ink-muted dark:bg-muted dark:text-muted-foreground">
                                termasuk aset di sub-scope
                            </span>
                        )}
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
                                    asChild
                                >
                                    <Link
                                        href={
                                            selectedCount > 0
                                                ? labels.url({
                                                      query: {
                                                          ids: selectedIds,
                                                      },
                                                  })
                                                : '#'
                                        }
                                    >
                                        Cetak yang dipilih
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={labelsBatch.url()}>
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
