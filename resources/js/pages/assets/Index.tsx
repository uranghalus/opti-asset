/*
 * MANIFEST DECK — komposisi halaman Aset dalam material DESIGN.md.
 * THESIS: arsip aset dibaca seperti meja manifest kargo — deck perintah
 * di atas, register klasifikasi di sisi, lembar pos di tengah — tetapi
 * seluruhnya bermaterial kaca (blur 10-20px, putih translusen, border
 * 1px terang) di atas VibrantBackground varian default (Electric Blue
 * #0080FF → Purple, aksen modul assets). Menolak template admin generik
 * (sidebar + grid kartu seragam) dan menolak kaca sebagai dekorasi:
 * setiap blur adalah permukaan kerja.
 * OWN-WORLD: NOON (.dark.noon scope) + primary amber #FFB23E;
 * kode selalu mono 13px tabular; status adalah stempel semantik;
 * satu aset = satu kartu depot grid (pita traffic-light, spanduk foto,
 * keping sewarna level); barcode adalah ornamen fungsional.
 * Tanpa tabel, tanpa kepala kolom, tanpa gradien teks, tanpa hitam
 * murni; radius sm 6px / md 8px / lg 12px; H1 2rem.
 * STORY: operator paham posisi drill-down, total pos, saringan, dan
 * pilihan dalam sekali pandang; kondisi kosong selalu bernama
 * masalahnya dan menawarkan pemulihan. FIRST VIEWPORT: deck kaca
 * (judul H1 + garis meta + aksi), strip rute, lalu rel indeks +
 * lembar manifest. FORM: grounded #4 dari tujuh kandidat
 * (meja manifest kargo), seed d76824f1 mode operate, dimaterialkan
 * ulang ke glassmorphism DESIGN.md. FINISH: unreviewed and
 * undocumented is unfinished; this build ends with the finish review,
 * the verdict, and DESIGN.md.
 */
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { VibrantBackground } from '@/components/vibrant-background';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { rememberAssetListUrl } from '@/lib/asset-return';
import { cn } from '@/lib/utils';
import { index } from '@/routes/assets';

import { AssetBreadcrumb } from './components/asset-breadcrumb';
import { AssetBulkToolbar } from './components/asset-bulk-toolbar';
import { AssetCardGrid } from './components/asset-card-grid';
import {
    AssetDeleteDialog,
    AssetBulkDeleteDialog,
    AssetImportDialog,
} from './components/asset-dialogs';
import { AssetFilterBar, SelectAllBar } from './components/asset-filter-bar';

import { AssetsPageHeader } from './components/asset-page-header';
import { ClassificationSidebar } from './components/classification-sidebar';
import { FolderChips } from './components/folder-chips';
import type {
    Asset,
    BrowseNode,
    PageProps,
    PaginatedData,
} from './components/types';
import { findNode, MAX_BULK } from './components/types';

export default function AssetsIndex() {
    const {
        tree,
        selected: serverSelected,
        breadcrumb,
        assets,
        unclassifiedCount,
        items,
        filters,
    } = usePage<PageProps>().props;

    // Local state
    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [departmentFilter, setDepartmentFilter] = useState(
        filters.department,
    );
    const [conditionFilter, setConditionFilter] = useState(filters.condition);
    const [treeSearch, setTreeSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(
        serverSelected?.id ?? null,
    );
    const [deleting, setDeleting] = useState<Asset | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();
    const prevServerSelectedId = useRef<string | null>(null);

    // Sync server‑selected item changes
    useEffect(() => {
        const newId = serverSelected?.id ?? null;

        if (newId !== prevServerSelectedId.current && newId !== selectedId) {
            prevServerSelectedId.current = newId;
            setSelectedId(newId);
        }
    }, [serverSelected, selectedId]);

    // Remember current list URL for back‑navigation
    useEffect(() => {
        rememberAssetListUrl();
    }, []);

    // Cleanup pending search timeout
    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

    // Normalise assets payload
    const safeAssets: PaginatedData<Asset> = assets ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    };

    const selectedNode = findNode(tree, selectedId);
    const childFolders: BrowseNode[] = selectedNode
        ? (selectedNode.children ?? [])
        : tree;
    const visibleFolders = treeSearch.trim()
        ? tree.filter(
              (n) =>
                  n.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
                  (n.code?.toLowerCase().includes(treeSearch.toLowerCase()) ??
                      false),
          )
        : childFolders;

    const pageIds = safeAssets.data.map((a) => a.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const activeFilterCount =
        [statusFilter, departmentFilter, conditionFilter].filter(Boolean)
            .length +
        (search ? 1 : 0) +
        (selectedId ? 1 : 0);

    // Navigation helpers
    const navigate = (params: Record<string, string>) => {
        router.get(
            index.url({ query: params }),
            {},
            {
                preserveState: true,
                replace: true,
                only: ['tree', 'selected', 'breadcrumb', 'assets', 'filters'],
            },
        );
    };

    const currentParams = (): Record<string, string> => {
        const p: Record<string, string> = {};

        if (selectedId && serverSelected) {
            p.level = serverSelected.level;
            p.node = serverSelected.id;
        } else if (filters.level && filters.node) {
            p.level = filters.level;
            p.node = filters.node;
        }

        if (search.trim()) {
            p.search = search.trim();
        }

        if (statusFilter) {
            p.status = statusFilter;
        }

        if (departmentFilter) {
            p.department = departmentFilter;
        }

        if (conditionFilter) {
            p.condition = conditionFilter;
        }

        return p;
    };

    const reload = (overrides: Record<string, string>) => {
        navigate({ ...currentParams(), ...overrides });
    };

    // Handlers
    const handleNodeSelect = (node: BrowseNode) => {
        setSelectedId(node.id);
        setDrawerOpen(false);
        const p: Record<string, string> = { level: node.level, node: node.id };

        if (search.trim()) {
            p.search = search.trim();
        }

        if (statusFilter) {
            p.status = statusFilter;
        }

        if (departmentFilter) {
            p.department = departmentFilter;
        }

        if (conditionFilter) {
            p.condition = conditionFilter;
        }

        navigate(p);
    };

    const clearNode = () => {
        setSelectedId(null);
        const p: Record<string, string> = {};

        if (search.trim()) {
            p.search = search.trim();
        }

        if (statusFilter) {
            p.status = statusFilter;
        }

        if (departmentFilter) {
            p.department = departmentFilter;
        }

        if (conditionFilter) {
            p.condition = conditionFilter;
        }

        navigate(p);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setDepartmentFilter('');
        setConditionFilter('');
        navigate(
            selectedId && serverSelected
                ? { level: serverSelected.level, node: serverSelected.id }
                : {},
        );
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const n = new Set(prev);

            if (n.has(id)) {
                n.delete(id);
            } else if (n.size < MAX_BULK) {
                n.add(id);
            } else {
                toast.warning(`Maksimal ${MAX_BULK} pos per perintah.`);
            }

            return n;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelected((p) => {
                const n = new Set(p);
                pageIds.forEach((id) => n.delete(id));

                return n;
            });
        } else {
            const avail = MAX_BULK - selected.size;
            const toAdd = pageIds
                .filter((id) => !selected.has(id))
                .slice(0, Math.max(0, avail));
            setSelected((p) => {
                const n = new Set(p);
                toAdd.forEach((id) => n.add(id));

                return n;
            });
        }
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => reload({ search: value }), 350);
    };

    const contextLabel = selectedNode
        ? `Rute aktif — ${breadcrumb.length > 0 ? breadcrumb.map((b) => b.name).join(' / ') : selectedNode.name}`
        : null;

    // Render – Manifest Deck dalam material glassmorphism DESIGN.md
    return (
        <div
            className={cn(
                'manifest-scope noon dark relative flex min-h-[100dvh] flex-col bg-background text-foreground',
                selected.size > 0 && 'pb-32 lg:pb-8',
                isProcessing && 'pointer-events-none opacity-60',
            )}
        >
            <VibrantBackground variant="default" />

            <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
                <div className="relative transition-all duration-200">
                    {/* Processing overlay */}
                    {isProcessing && (
                        <div className="absolute top-1/2 left-1/2 z-[200] -translate-x-1/2 -translate-y-1/2">
                            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-md">
                                <Spinner className="size-4" />
                                Mencatat...
                            </div>
                        </div>
                    )}

                    {/* Command deck */}
                    <AssetsPageHeader
                        initialLevel={filters.initialLevel}
                        selectedCount={selected.size}
                        total={safeAssets.total}
                        activeFilterCount={activeFilterCount}
                        contextLabel={contextLabel}
                        onToggleDrawer={() => setDrawerOpen((v) => !v)}
                        onOpenImport={() => setImportOpen(true)}
                    />

                    {/* Route strip */}
                    <AssetBreadcrumb
                        breadcrumb={breadcrumb}
                        onClear={clearNode}
                        onNavigate={handleNodeSelect}
                    />

                    {/* Deck body: register + ledger */}
                    <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
                        <ClassificationSidebar
                            tree={tree}
                            selectedId={selectedId}
                            selectedNode={selectedNode}
                            visibleFolders={visibleFolders}
                            treeSearch={treeSearch}
                            totalAssets={safeAssets.total}
                            unclassifiedCount={unclassifiedCount ?? 0}
                            drawerOpen={drawerOpen}
                            onTreeSearch={setTreeSearch}
                            onSelect={handleNodeSelect}
                            onClear={clearNode}
                        />

                        <section
                            aria-label="Lembar manifest aset"
                            className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-lg"
                        >
                            <AssetFilterBar
                                search={search}
                                onSearchChange={handleSearchChange}
                                onSearchClear={() => {
                                    setSearch('');
                                    reload({ search: '' });
                                }}
                                activeFilterCount={activeFilterCount}
                                onClearFilters={clearFilters}
                                allSelected={allSelected}
                                onToggleSelectAll={toggleSelectAll}
                                hasAssets={safeAssets.data.length > 0}
                                selectedCount={selected.size}
                                selectedNodeName={selectedNode?.name ?? null}
                            />

                            {selectedNode && childFolders.length > 0 && (
                                <FolderChips
                                    selectedNode={selectedNode}
                                    childFolders={childFolders}
                                    onSelect={handleNodeSelect}
                                />
                            )}

                            <SelectAllBar
                                allSelected={allSelected}
                                onToggleSelectAll={toggleSelectAll}
                                disabled={safeAssets.data.length === 0}
                                label={
                                    selectedNode
                                        ? `Pos di ${breadcrumb[breadcrumb.length - 1]?.name ?? selectedNode.name}`
                                        : 'Semua Pos'
                                }
                                total={safeAssets.total}
                                selectedCount={selected.size}
                            />

                            <AssetCardGrid
                                assets={safeAssets}
                                selected={selected}
                                onToggleSelect={toggleSelect}
                                onDelete={setDeleting}
                                search={search}
                                canClearFilters={Boolean(
                                    search.trim() ||
                                    statusFilter ||
                                    departmentFilter ||
                                    conditionFilter,
                                )}
                                onClearFilters={clearFilters}
                                goToPage={goToPage}
                            />
                        </section>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AssetDeleteDialog
                asset={deleting}
                onClose={() => setDeleting(null)}
            />
            <AssetBulkDeleteDialog
                open={bulkDeleteOpen}
                count={selected.size}
                onOpenChange={setBulkDeleteOpen}
                onSuccess={() => setSelected(new Set())}
            />
            <AssetImportDialog
                open={importOpen}
                items={items}
                onClose={() => setImportOpen(false)}
            />

            {/* Slip pilihan massal */}
            <AssetBulkToolbar
                selectedCount={selected.size}
                onClear={() => setSelected(new Set())}
                onBulkDelete={() => setBulkDeleteOpen(true)}
            />
        </div>
    );
}
