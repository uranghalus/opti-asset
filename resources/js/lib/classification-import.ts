/**
 * Pure import helpers for the classification page: canonical column keys
 * (mirroring `ImportClassificationsAction::normalizeRow`) and the
 * sheet → row parser used for the import preview.
 */
export type ImportRow = {
    level: string;
    name: string;
    code: string;
    description: string;
    parent_code: string;
};

/**
 * Canonical hierarchy columns, keyed exactly like the backend parser:
 * lowercase, non-alphanumerics collapsed to a single underscore. Any
 * header spelling that normalizes to the same key previews exactly
 * what the backend will import.
 */
export const HIERARCHY_COLUMNS: Array<{ key: string; level: string }> = [
    { key: 'golongan_aset', level: 'group' },
    { key: 'bidang_kategori_aset', level: 'category' },
    { key: 'kelompok_aset', level: 'cluster' },
    { key: 'sub_kelompok_aset', level: 'sub-cluster' },
];

export function normalizeHeaderCell(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function rowsFromSheet(data: string[][]): ImportRow[] {
    const headerIndex = data.findIndex((row) => {
        const header = row.map(normalizeHeaderCell);

        return (
            (header.includes('level') && header.includes('name')) ||
            HIERARCHY_COLUMNS.some((column) => header.includes(column.key))
        );
    });

    if (headerIndex === -1) {
        return [];
    }

    const header = data[headerIndex].map(normalizeHeaderCell);

    const hasColumn = (name: string) => header.includes(name);

    // Legacy flat format: level / name / code / description / parent_code
    if (hasColumn('level') && hasColumn('name')) {
        const indexOf = (name: string) => header.indexOf(name);

        return data
            .slice(headerIndex + 1)
            .map((cells) => {
                const at = (name: string) =>
                    indexOf(name) === -1
                        ? ''
                        : (cells[indexOf(name)]?.trim() ?? '');

                return {
                    level: at('level'),
                    name: at('name'),
                    code: at('code'),
                    description: at('description'),
                    parent_code: at('parent_code'),
                };
            })
            .filter((row) => row.name !== '');
    }

    // Hierarchy format: Golongan Aset | Bidang/Kategori | Kelompok | Sub Kelompok | Uraian | Keterangan
    const columns = HIERARCHY_COLUMNS.filter((column) =>
        hasColumn(column.key),
    ).map((column) => ({
        ...column,
        index: header.indexOf(column.key),
    }));

    if (columns.length === 0) {
        return [];
    }

    const uraianIndex = header.indexOf('uraian');
    const keteranganIndex = header.indexOf('keterangan');

    return data
        .slice(headerIndex + 1)
        .map((cells) => {
            const filled = columns
                .filter((column) => (cells[column.index]?.trim() ?? '') !== '')
                .map((column) => ({
                    ...column,
                    value: (cells[column.index] ?? '').trim(),
                }));

            if (filled.length === 0) {
                return null;
            }

            const node = filled[filled.length - 1];
            // Build the full dotted ancestor path so the backend can
            // unambiguously resolve the parent chain regardless of depth.
            // e.g. sub-cluster under group='03', category='03', cluster='11'
            // → parent_code='03.03.11'  (not just '11')
            const parentPath =
                filled.length > 1
                    ? filled
                          .slice(0, -1)
                          .map((col) => col.value)
                          .join('.')
                    : '';

            return {
                level: node.level,
                name:
                    uraianIndex === -1
                        ? ''
                        : (cells[uraianIndex]?.trim() ?? ''),
                code: node.value,
                description:
                    keteranganIndex === -1
                        ? ''
                        : (cells[keteranganIndex]?.trim() ?? ''),
                parent_code: parentPath,
            };
        })
        .filter((row): row is ImportRow => row !== null && row.name !== '');
}
