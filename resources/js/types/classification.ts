export type ClassificationLevel =
    'group' | 'category' | 'cluster' | 'sub-cluster';

export type ClassificationNode = {
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    notes?: string | null;
    child_count: number;
    asset_count?: number;
    item_count?: number;
    children?: ClassificationNode[];
};

export type ClassificationFormValues = {
    code: string;
    name: string;
    description: string;
    notes: string;
};

export const LEVEL_LABELS: Record<ClassificationLevel, string> = {
    group: 'Golongan Asset',
    category: 'Kategori Asset',
    cluster: 'Cluster Asset',
    'sub-cluster': 'Sub Cluster Asset',
};

export const CHILD_LABELS: Record<
    Exclude<ClassificationLevel, 'sub-cluster'>,
    string
> = {
    group: 'kategori',
    category: 'cluster',
    cluster: 'sub cluster',
};
