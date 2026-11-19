/**
 * Kontrak data & util bersama untuk blok dashboard (`@/components/dashboard/*`).
 *
 * Nama prop dan bentuk data di sini WAJIB sama dengan payload
 * `DashboardController@__invoke` — jangan diubah tanpa memperbarui backend.
 */

export type AssetByStatus = {
    ACT: number;
    LOAN: number;
    RPR: number;
    MUT: number;
    DSP: number;
};

export type Stats = {
    total_assets: number;
    asset_by_status: AssetByStatus;
    pending_transfers: number;
    pending_disposals: number;
};

export type ClassificationSlice = {
    name: string;
    count: number;
    tipe?: string | null;
};

export type AssetTypeSlice = {
    type: string;
    label: string;
    count: number;
    value: string;
    book_value: string;
};

export type LocationSlice = { name: string; count: number };

export type RecentTransfer = {
    id: string;
    asset_kode: string;
    from: string;
    to: string;
    status: string;
    date: string;
};

export type RecentDisposal = {
    id: string;
    asset_kode: string;
    reason: string;
    status: string;
    date: string;
};

export type WarrantyAsset = {
    id: string;
    kode_asset: string | null;
    brand: string | null;
    model: string | null;
    warranty_expire: string;
    days_until: number;
};

export type WarrantyAlerts = {
    expired: number;
    expiring_soon: number;
    expiring_30: number;
    assets: WarrantyAsset[];
};

export type DashboardPageProps = {
    tenant?: { code: string; name?: string } | null;
    stats: Stats;
    asset_by_classification: ClassificationSlice[];
    asset_by_type: AssetTypeSlice[];
    asset_by_location: LocationSlice[];
    recent_transfers: RecentTransfer[];
    recent_disposals: RecentDisposal[];
    integrity_score: number;
    warranty_alerts: WarrantyAlerts;
};

/* ------------------------------------------------------------------ */
/* Peta status aset (LOCKED — DESIGN.md §Status, P1)                    */
/* Hue semantik; warna tidak pernah satu-satunya penanda (selalu        */
/* ditemani label/ikon). Token CSS bertukar otomatis antara light/dark. */
/* ------------------------------------------------------------------ */

export type StatusVarSet = {
    text: string;
    bg: string;
    border: string;
};

export const STATUS_META: Record<
    keyof AssetByStatus,
    { label: string; vars: StatusVarSet }
> = {
    ACT: {
        label: 'Aktif',
        vars: {
            text: 'var(--status-act-text)',
            bg: 'var(--status-act-bg)',
            border: 'var(--status-act-border)',
        },
    },
    LOAN: {
        label: 'Dipinjamkan',
        vars: {
            text: 'var(--status-loan-text)',
            bg: 'var(--status-loan-bg)',
            border: 'var(--status-loan-border)',
        },
    },
    RPR: {
        label: 'Dalam Perbaikan',
        vars: {
            text: 'var(--status-rpr-text)',
            bg: 'var(--status-rpr-bg)',
            border: 'var(--status-rpr-border)',
        },
    },
    MUT: {
        label: 'Dimutasi',
        vars: {
            text: 'var(--status-mut-text)',
            bg: 'var(--status-mut-bg)',
            border: 'var(--status-mut-border)',
        },
    },
    DSP: {
        label: 'Dihapus',
        vars: {
            text: 'var(--status-dsp-text)',
            bg: 'var(--status-dsp-bg)',
            border: 'var(--status-dsp-border)',
        },
    },
};

export const STATUS_ORDER: (keyof AssetByStatus)[] = [
    'ACT',
    'LOAN',
    'RPR',
    'MUT',
    'DSP',
];

/* Status pengajuan (mutasi & disposal) — nilai enum dari backend. */
export const APPROVAL_STATUS: Record<
    string,
    { label: string; vars: StatusVarSet }
> = {
    pending: {
        label: 'Menunggu Persetujuan',
        vars: {
            text: 'var(--status-rpr-text)',
            bg: 'var(--status-rpr-bg)',
            border: 'var(--status-rpr-border)',
        },
    },
    approved: {
        label: 'Disetujui',
        vars: {
            text: 'var(--status-act-text)',
            bg: 'var(--status-act-bg)',
            border: 'var(--status-act-border)',
        },
    },
    rejected: {
        label: 'Ditolak',
        vars: {
            text: 'var(--status-dsp-text)',
            bg: 'var(--status-dsp-bg)',
            border: 'var(--status-dsp-border)',
        },
    },
};

/* ------------------------------------------------------------------ */
/* Formatter (id-ID) — semua aman terhadap null/NaN/NaN%               */
/* ------------------------------------------------------------------ */

const BLN_SINGKAT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

/** Bilangan bulat dengan pemisah ribuan id-ID (aman untuk null/NaN). */
export function num(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0';
    }

    return Math.round(value).toLocaleString('id-ID');
}

/** Uang rupiah penuh: `Rp1.250.000`. */
export function rp(value: number | null | undefined): string {
    return `Rp${num(value)}`;
}

/**
 * Uang ringkas untuk label chart: `Rp12,5 jt`. Untuk angka penuh
 * (tooltip, label baris) tetap pakai `rp()`.
 */
export function rpCompact(value: number | null | undefined): string {
    if (!value || Number.isNaN(value)) {
        return 'Rp0';
    }

    const formatted = new Intl.NumberFormat('id-ID', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

    return `Rp${formatted}`;
}

/** Persentase aman: total 0 tidak pernah menghasilkan NaN. */
export function pct(part: number | null | undefined, total: number): number {
    if (!part || !total || total <= 0) {
        return 0;
    }

    return Math.round((part / total) * 100);
}

/** `17 Nov 2026` — aman untuk string kosong/tanggal tidak valid. */
export function fullDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
        return '—';
    }

    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/** `17 Nov` — untuk baris padat. */
export function shortDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
        return '—';
    }

    return `${d.getDate()} ${BLN_SINGKAT[d.getMonth()] ?? ''}`.trim();
}

/** Waktu relatif id-ID: `3 hari yang lalu`, `baru saja`. */
export function relTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const then = new Date(iso).getTime();

    if (Number.isNaN(then)) {
        return '—';
    }

    const diffMs = Date.now() - then;

    if (diffMs < 0) {
        return 'baru saja';
    }

    const rtf = new Intl.RelativeTimeFormat('id-ID', {
        numeric: 'auto',
    });
    const minutes = Math.round(diffMs / 60000);

    if (minutes < 1) {
        return 'baru saja';
    }

    if (minutes < 60) {
        return rtf.format(-minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return rtf.format(-hours, 'hour');
    }

    const days = Math.round(hours / 24);

    if (days < 30) {
        return rtf.format(-days, 'day');
    }

    const months = Math.round(days / 30);

    if (months < 12) {
        return rtf.format(-months, 'month');
    }

    return rtf.format(-Math.round(months / 12), 'year');
}

/**
 * `value` dari backend berupa string numerik (`number_format`, mis.
 * `"12500000.00"`) — parse aman; nilai non-numerik dibaca 0.
 */
export function toNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
        return 0;
    }

    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));

    return Number.isFinite(parsed) ? parsed : 0;
}
