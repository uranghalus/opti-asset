import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type AssetType = 'fixed_asset' | 'equipment';

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'ACT', label: 'Aktif' },
    { value: 'LOAN', label: 'Dipinjamkan' },
    { value: 'RPR', label: 'Perbaikan' },
    { value: 'MUT', label: 'Dimutasi' },
    { value: 'DSP', label: 'Dihapus' },
];

/**
 * Bar pencarian + panel filter (tiket 05): pencarian dominan, Tipe/Status/
 * Lokasi di dalam satu panel berlabel dengan badge jumlah filter aktif.
 * Chip di bawah bar menampilkan filter yang sedang aktif — semuanya bisa
 * dilepas satu per satu. Panel digerakkan tombol "Filter", bukan reset.
 */
export function AssetFilterBar({
    search,
    onSearchChange,
    onSearchClear,
    activeFilterCount,
    onClearFilters,
    assetType,
    onAssetTypeChange,
    status,
    onStatusChange,
    locations,
    location,
    onLocationChange,
    hasAssets,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    activeFilterCount: number;
    onClearFilters: () => void;
    assetType: AssetType | '';
    onAssetTypeChange: (value: AssetType | '') => void;
    status: string;
    onStatusChange: (status: string) => void;
    locations: { id: string; name: string }[];
    location: string;
    onLocationChange: (value: string) => void;
    hasAssets: boolean;
}) {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (assetType) {
        chips.push({
            key: 'asset_type',
            label: assetType === 'fixed_asset' ? 'Aktiva Tetap' : 'Peralatan',
            onRemove: () => onAssetTypeChange(''),
        });
    }

    if (status) {
        chips.push({
            key: 'status',
            label:
                STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status,
            onRemove: () => onStatusChange(''),
        });
    }

    if (location) {
        chips.push({
            key: 'location',
            label:
                locations.find((loc) => loc.id === location)?.name ?? 'Lokasi',
            onRemove: () => onLocationChange(''),
        });
    }

    return (
        <div className="border-b border-border px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Cari nama, kode, serial, brand, model…"
                        aria-label="Cari aset"
                        className="h-11 rounded-md pr-12 pl-10 text-sm"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={onSearchClear}
                            aria-label="Bersihkan pencarian"
                            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            <X className="size-4" />
                        </button>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {hasAssets && (
                        <div className="flex items-center gap-1.5">
                            {/* Tipe tetap tersedia cepat di luar panel. */}
                            <Select
                                value={assetType || 'all'}
                                onValueChange={(v) =>
                                    onAssetTypeChange(
                                        v === 'all' ? '' : (v as AssetType),
                                    )
                                }
                            >
                                <SelectTrigger
                                    className="h-9 w-[130px]"
                                    aria-label="Filter tipe aset"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Tipe
                                    </SelectItem>
                                    <SelectItem value="fixed_asset">
                                        Aktiva Tetap
                                    </SelectItem>
                                    <SelectItem value="equipment">
                                        Peralatan
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <FilterPanelButton
                                status={status}
                                onStatusChange={onStatusChange}
                                locations={locations}
                                location={location}
                                onLocationChange={onLocationChange}
                                activeFilterCount={activeFilterCount}
                            />
                        </div>
                    )}
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

            {(chips.length > 0 || Boolean(search)) && (
                <div
                    aria-label="Filter aktif"
                    className="mt-2.5 flex flex-wrap items-center gap-1.5"
                >
                    {Boolean(search) && (
                        <button
                            type="button"
                            onClick={onSearchClear}
                            className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-border bg-surface-sunken px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none dark:bg-muted"
                        >
                            “{search}”
                            <X className="size-3" aria-hidden />
                        </button>
                    )}
                    {chips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={chip.onRemove}
                            className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-border bg-surface-sunken px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none dark:bg-muted"
                        >
                            {chip.label}
                            <X className="size-3" aria-hidden />
                            <span className="sr-only">— hapus filter</span>
                        </button>
                    ))}
                    {chips.length > 1 && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="inline-flex h-7 items-center rounded-sm px-2 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            Bersihkan semua
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/** Tombol + popover panel filter berlabel (Status, Lokasi). */
function FilterPanelButton({
    status,
    onStatusChange,
    locations,
    location,
    onLocationChange,
    activeFilterCount,
}: {
    status: string;
    onStatusChange: (status: string) => void;
    locations: { id: string; name: string }[];
    location: string;
    onLocationChange: (value: string) => void;
    activeFilterCount: number;
}) {
    const panelCount = (status ? 1 : 0) + (location ? 1 : 0);

    return (
        <details className="group relative">
            <summary
                className={cn(
                    'inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors',
                    'hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    'marker:hidden [&::-webkit-details-marker]:hidden',
                )}
            >
                Filter
                {activeFilterCount > 0 && (
                    <span className="rounded-sm bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">
                        {activeFilterCount}
                    </span>
                )}
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-overlay)]">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Filter
                </p>
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-foreground">
                            Status
                        </span>
                        <Select
                            value={status || 'all'}
                            onValueChange={(v) =>
                                onStatusChange(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger
                                className="h-9"
                                aria-label="Filter status"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Status
                                </SelectItem>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-foreground">
                            Lokasi
                        </span>
                        <Select
                            value={location || 'all'}
                            onValueChange={(v) =>
                                onLocationChange(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger
                                className="h-9"
                                aria-label="Filter lokasi"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua Lokasi
                                </SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>
                {panelCount > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                            onStatusChange('');
                            onLocationChange('');
                        }}
                    >
                        Reset panel
                    </Button>
                )}
            </div>
        </details>
    );
}

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
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-sunken px-4 py-2.5 text-xs sm:px-5">
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
                <span className="shrink-0 rounded-sm bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground tabular-nums">
                    {total}
                </span>
            </label>
            {selectedCount > 0 && (
                <span
                    aria-live="polite"
                    className="shrink-0 font-semibold text-foreground"
                >
                    {selectedCount} dipilih
                </span>
            )}
        </div>
    );
}
