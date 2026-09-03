import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

/**
 * Meja kontrol lembar kerja — pencarian pos, tombol saringan
 * dengan cap hitungan, dan tombol reset.
 */
export function AssetFilterBar({
    search,
    onSearchChange,
    onSearchClear,
    activeFilterCount,
    onClearFilters,
    allSelected,
    onToggleSelectAll,
    hasAssets,
    selectedCount,
    selectedNodeName,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    activeFilterCount: number;
    onClearFilters: () => void;
    allSelected: boolean;
    onToggleSelectAll: () => void;
    hasAssets: boolean;
    selectedCount: number;
    selectedNodeName: string | null;
}) {
    return (
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative min-w-0 flex-1">
                <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Cari kode, serial, brand, model..."
                    aria-label="Cari aset"
                    className="h-11 rounded-md border-white/15 bg-white/10 pr-16 pl-10 font-mono text-sm backdrop-blur-sm"
                />
                {search ? (
                    <button
                        type="button"
                        onClick={onSearchClear}
                        aria-label="Bersihkan pencarian"
                        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                        <X className="size-4" />
                    </button>
                ) : (
                    <kbd
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[13px] font-bold text-muted-foreground sm:block"
                    >
                        MNF
                    </kbd>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClearFilters}
                    className="rounded-md border-white/20 bg-white/10 backdrop-blur-sm"
                >
                    <SlidersHorizontal className="size-4" />
                    Saringan
                    {activeFilterCount > 0 && (
                        <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-[13px] font-bold text-primary-foreground tabular-nums">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                {activeFilterCount > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClearFilters}
                        className="size-10 rounded-md"
                        aria-label="Reset semua saringan"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Baris cap borongan — identitas lembar aktif, total pos,
 * dan hitungan pilihan dalam satu garis ledger.
 */
export function SelectAllBar({
    allSelected,
    onToggleSelectAll,
    disabled,
    label,
    total,
    selectedCount,
}: {
    allSelected: boolean;
    onToggleSelectAll: () => void;
    disabled: boolean;
    label: string;
    total: number;
    selectedCount: number;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs sm:px-5">
            <label className="flex min-w-0 cursor-pointer items-center gap-2.5 font-semibold text-foreground">
                <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={onToggleSelectAll}
                    disabled={disabled}
                    aria-label="Pilih semua di halaman ini"
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span className="min-w-0 truncate">{label}</span>
                <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 font-mono font-bold text-primary-foreground tabular-nums">
                    {total}
                </span>
            </label>
            <span
                aria-live="polite"
                className="shrink-0 font-mono font-bold tracking-wider text-muted-foreground uppercase"
            >
                {selectedCount > 0
                    ? `${selectedCount} dipilih`
                    : 'Tanpa pilihan'}
            </span>
        </div>
    );
}
