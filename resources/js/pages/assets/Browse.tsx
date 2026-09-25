import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/spinner';

import { useIsProcessing } from '@/hooks/use-is-processing';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { rememberAssetListUrl } from '@/lib/asset-return';
import { cn } from '@/lib/utils';
import { index } from '@/routes/assets';

import type { ClassificationLevel } from '@/types/classification';
import { AssetBreadcrumb } from './components/asset-breadcrumb';
import { AssetBulkToolbar } from './components/asset-bulk-toolbar';
import type { AssetListView } from './components/asset-card-grid';
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
import { ImportResultPanel } from './components/import-result-panel';
import type {
    Asset,
    BrowseNode,
    PageProps,
    PaginatedData,
} from './components/types';
import { findNode, MAX_BULK } from './components/types';

export interface BrowseProps {
    pageProps: PageProps;
}

export default function Browse({ pageProps }: BrowseProps) {
    const {
        tree,
        selected: serverSelected,
        breadcrumb,
        assets,
        unclassifiedCount,
        descendantFallback,
        items = [],
        locations,
        filters,
    } = pageProps;

    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [assetTypeFilter, setAssetTypeFilter] = useState<string>(
        filters.asset_type ?? '',
    );
    const [departmentFilter, setDepartmentFilter] = useState(
        filters.department,
    );
    const [locationFilter, setLocationFilter] = useState(
        filters.location ?? '',
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
    const [listView, setListView] = useLocalStorage<AssetListView>(
        'opti-asset.assets-list-view',
        'table',
    );

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();
    const prevServerSelectedId = useRef<string | null>(null);

    useEffect(() => {
        const newId = serverSelected?.id ?? null;

        if (newId !== prevServerSelectedId.current && newId !== selectedId) {
            prevServerSelectedId.current = newId;
            setSelectedId(newId);
        }
    }, [serverSelected, selectedId]);

    useEffect(() => {
        rememberAssetListUrl();
    }, []);

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        };
    }, []);

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
        [
            statusFilter,
            departmentFilter,
            conditionFilter,
            locationFilter,
        ].filter(Boolean).length +
        (search ? 1 : 0) +
        (selectedId ? 1 : 0);

    const navigate = (params: Record<string, string>) => {
        router.get(
            index.url({ query: params }),
            {},
            {
                preserveState: true,
                replace: true,
                only: [
                    'tree',
                    'selected',
                    'breadcrumb',
                    'assets',
                    'unclassifiedCount',
                    'descendantFallback',
                    'items',
                    'filters',
                ],
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

        if (locationFilter) {
            p.location = locationFilter;
        }

        if (assetTypeFilter) {
            p.asset_type = assetTypeFilter;
        }

        if (conditionFilter) {
            p.condition = conditionFilter;
        }

        return p;
    };

    const reload = (overrides: Record<string, string>) => {
        navigate({ ...currentParams(), ...overrides });
    };

    const handleNodeSelect = (node: BrowseNode) => {
        setSelectedId(node.id);
        setDrawerOpen(false);
        const p = currentParams();
        p.level = node.level;
        p.node = node.id;

        navigate(p);
    };

    const clearNode = () => {
        setSelectedId(null);
        navigate(currentParams());
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setAssetTypeFilter('');
        setDepartmentFilter('');
        setLocationFilter('');
        setConditionFilter('');
        navigate(currentParams());
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const n = new Set(prev);

            if (n.has(id)) {
                n.delete(id);
            } else if (n.size < MAX_BULK) {
                n.add(id);
            } else {
                toast.warning(`Maksimal ${MAX_BULK} aset per perintah.`);
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

    return (
        <div
            className={cn(
                'relative flex min-h-[100dvh] flex-col bg-background text-foreground',
                selected.size > 0 && 'pb-32 lg:pb-8',
                isProcessing && 'pointer-events-none opacity-60',
            )}
        >
            <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
                <div className="relative transition-all duration-200">
                    {isProcessing && (
                        <div className="absolute top-1/2 left-1/2 z-[200] -translate-x-1/2 -translate-y-1/2">
                            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-overlay)]">
                                <Spinner className="size-4" />
                                Mencatat...
                            </div>
                        </div>
                    )}

                    <AssetsPageHeader
                        selectedCount={selected.size}
                        selectedIds={Array.from(selected)}
                        total={safeAssets.total}
                        activeFilterCount={activeFilterCount}
                        breadcrumb={breadcrumb}
                        scopeNode={selectedNode}
                        descendantFallback={descendantFallback}
                        onToggleDrawer={() => setDrawerOpen((v) => !v)}
                        onOpenImport={() => setImportOpen(true)}
                    />

                    {breadcrumb.length > 0 && (
                        <AssetBreadcrumb
                            breadcrumb={breadcrumb.slice(0, -1)}
                            onClear={clearNode}
                            onNavigate={handleNodeSelect}
                        />
                    )}

                    <div className="mt-4">
                        <ImportResultPanel />
                    </div>

                    <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
                        <ClassificationSidebar
                            tree={tree}
                            selectedId={selectedId}
                            selectedNode={selectedNode}
                            visibleFolders={visibleFolders}
                            treeSearch={treeSearch}
                            totalAssets={safeAssets.total}
                            unclassifiedCount={unclassifiedCount ?? 0}
                            unclassifiedLevel={
                                (filters.initialLevel as ClassificationLevel) ||
                                'cluster'
                            }
                            drawerOpen={drawerOpen}
                            onTreeSearch={setTreeSearch}
                            onSelect={handleNodeSelect}
                            onClear={clearNode}
                        />

                        <section
                            aria-label="Daftar aset"
                            className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
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
                                assetType={
                                    assetTypeFilter as
                                        '' | 'fixed_asset' | 'equipment'
                                }
                                onAssetTypeChange={(v) => {
                                    setAssetTypeFilter(v);
                                    reload(
                                        v
                                            ? { asset_type: v }
                                            : { asset_type: '' },
                                    );
                                }}
                                status={statusFilter}
                                onStatusChange={(v) => {
                                    setStatusFilter(v);
                                    reload(v ? { status: v } : { status: '' });
                                }}
                                locations={locations}
                                location={locationFilter}
                                onLocationChange={(v) => {
                                    setLocationFilter(v);
                                    reload(
                                        v ? { location: v } : { location: '' },
                                    );
                                }}
                                hasAssets={safeAssets.data.length > 0}
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
                                        ? `Aset di ${breadcrumb[breadcrumb.length - 1]?.name ?? selectedNode.name}`
                                        : 'Semua aset'
                                }
                                total={safeAssets.total}
                                selectedCount={selected.size}
                            />

                            <AssetCardGrid
                                assets={safeAssets}
                                selected={selected}
                                scopeLevel={
                                    (selectedNode?.level as
                                        ClassificationLevel | undefined) ?? null
                                }
                                onToggleSelect={toggleSelect}
                                onDelete={setDeleting}
                                search={search}
                                canClearFilters={Boolean(
                                    search.trim() ||
                                    statusFilter ||
                                    departmentFilter ||
                                    locationFilter ||
                                    conditionFilter,
                                )}
                                onClearFilters={clearFilters}
                                goToPage={goToPage}
                                view={listView}
                                onViewChange={setListView}
                            />
                        </section>
                    </div>
                </div>
            </div>

            <AssetDeleteDialog
                asset={deleting}
                onClose={() => setDeleting(null)}
            />
            <AssetBulkDeleteDialog
                open={bulkDeleteOpen}
                count={selected.size}
                selectedIds={Array.from(selected)}
                onOpenChange={setBulkDeleteOpen}
                onSuccess={() => setSelected(new Set())}
            />
            <AssetImportDialog
                open={importOpen}
                items={items ?? []}
                onClose={() => setImportOpen(false)}
            />

            <AssetBulkToolbar
                selectedCount={selected.size}
                onClear={() => setSelected(new Set())}
                onBulkDelete={() => setBulkDeleteOpen(true)}
            />
        </div>
    );
}
