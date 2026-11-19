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
    tipe: string;
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

    // Legacy flat format: level / name / code / description / parent_code / tipe
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
                    tipe: at('tipe'),
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
    const tipeIndex = header.indexOf('tipe');

    // Sheets are often "ragged": a category row may only fill its own column
    // and inherit the golongan from the row above. Carry the last seen value
    // per level, resetting deeper levels whenever a shallower one changes.
    const carry: Record<string, string> = {};
    const rows: ImportRow[] = [];

    for (const cells of data.slice(headerIndex + 1)) {
        const filled: Array<{ level: string; value: string }> = [];

        for (const column of HIERARCHY_COLUMNS) {
            const present = columns.find(
                (entry) => entry.level === column.level,
            );

            if (!present) {
                continue;
            }

            const value = (cells[present.index] ?? '').trim();

            if (value !== '') {
                carry[column.level] = value;

                const current = HIERARCHY_COLUMNS.findIndex(
                    (entry) => entry.level === column.level,
                );

                for (
                    let deeper = current + 1;
                    deeper < HIERARCHY_COLUMNS.length;
                    deeper++
                ) {
                    delete carry[HIERARCHY_COLUMNS[deeper].level];
                }
            }

            if (carry[column.level]) {
                filled.push({
                    level: column.level,
                    value: carry[column.level],
                });
            }
        }

        if (filled.length === 0) {
            continue;
        }

        const node = filled[filled.length - 1];
        const name =
            uraianIndex === -1 ? '' : (cells[uraianIndex]?.trim() ?? '');

        if (name === '') {
            continue;
        }

        const parentPath =
            filled.length > 1
                ? filled
                      .slice(0, -1)
                      .map((column) => column.value)
                      .join('.')
                : '';

        let description =
            keteranganIndex === -1
                ? ''
                : (cells[keteranganIndex]?.trim() ?? '');
        let tipe =
            tipeIndex === -1
                ? ''
                : normalizeTipe(cells[tipeIndex]?.trim() ?? '');

        // Rekap sheets put the classification type in Keterangan
        // ("Aktiva Tetap"); only treat it as tipe for known values.
        if (tipe === '' && description !== '') {
            const derived = normalizeTipe(description);

            if (derived !== '') {
                tipe = derived;
                description = '';
            }
        }

        rows.push({
            level: node.level,
            name,
            code: node.value,
            description,
            parent_code: parentPath,
            tipe,
        });
    }

    return inferMissingTypes(rows);
}

/**
 * Mirror of the backend tipe normalizer: known spellings only, so a typo is
 * still surfaced in the preview instead of silently defaulting.
 */
export function normalizeTipe(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');

    switch (normalized) {
        case 'peralatan':
        case 'equipment':
            return 'peralatan';
        case 'aktiva_tetap':
        case 'fixed_asset':
            return 'aktiva_tetap';
        default:
            return '';
    }
}

/**
 * Fill a missing tipe from the rows under the same branch, mirroring
 * ImportClassificationsAction::inferMissingTypes(). Only a branch whose typed
 * rows all agree gets a type; mixed branches stay empty and the backend will
 * report them as skipped.
 */
export function inferMissingTypes(rows: ImportRow[]): ImportRow[] {
    const pathOf = (row: ImportRow): string | null => {
        const own = row.code.trim();

        if (own === '') {
            return null;
        }

        const parent = row.parent_code.trim();

        return parent === '' ? own : `${parent}.${own}`;
    };

    const typesByPrefix = new Map<string, Set<string>>();

    for (const row of rows) {
        const path = pathOf(row);

        if (path === null || row.tipe === '') {
            continue;
        }

        const parts = path.split('.');

        for (let depth = 1; depth <= parts.length; depth++) {
            const prefix = parts.slice(0, depth).join('.');
            const types = typesByPrefix.get(prefix) ?? new Set<string>();
            types.add(row.tipe);
            typesByPrefix.set(prefix, types);
        }
    }

    return rows.map((row) => {
        if (row.tipe !== '') {
            return row;
        }

        const path = pathOf(row);
        const types = path === null ? undefined : typesByPrefix.get(path);

        if (types && types.size === 1) {
            return { ...row, tipe: [...types][0] };
        }

        return row;
    });
}
