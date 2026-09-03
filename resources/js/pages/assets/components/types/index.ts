import type {
    ClassificationLevel,
    ClassificationNode,
} from '@/types/classification';

export type Asset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    status: string;
    condition: string | null;
    created_at: string;
    photo_url: string[];
    document_url: string[];
    item: { id: string; name: string; code: string } | null;
    location: { id: string; name: string } | null;
    department: { id_department: string; nama_department: string } | null;
    asset_group: { id: string; code: string | null; name: string } | null;
    asset_category: { id: string; code: string | null; name: string } | null;
    asset_cluster: { id: string; code: string | null; name: string } | null;
    asset_sub_cluster: { id: string; code: string | null; name: string } | null;
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export type BrowseNode = ClassificationNode & { children?: BrowseNode[] };

export type PageProps = {
    tree: BrowseNode[];
    selected: { level: ClassificationLevel; id: string } | null;
    breadcrumb: Array<{
        id: string;
        level: ClassificationLevel;
        code: string | null;
        name: string;
    }>;
    assets: PaginatedData<Asset> | null;
    unclassifiedCount: number;
    groups: Array<{ id: string; code: string | null; name: string }>;
    categories: Array<{
        id: string;
        code: string | null;
        name: string;
        asset_group_id: string;
    }>;
    items: Array<{
        id: string;
        code: string;
        name: string;
        category_code: string | null;
    }>;
    locations: Array<{ id: string; name: string }>;
    departments: Array<{ id_department: string; nama_department: string }>;
    filters: {
        search: string;
        status: string;
        department: string;
        condition: string;
        level: string;
        node: string;
        initialLevel: string;
    };
};

export const MAX_BULK = 100;

export const LEVEL_DEPTH: Record<ClassificationLevel, number> = {
    group: 0,
    category: 1,
    cluster: 2,
    'sub-cluster': 3,
};

export function findNode(
    nodes: BrowseNode[],
    id: string | null,
): BrowseNode | null {
    if (!id) {
        return null;
    }

    for (const n of nodes) {
        if (n.id === id) {
            return n;
        }

        const child = findNode(n.children ?? [], id);

        if (child) {
            return child;
        }
    }

    return null;
}
