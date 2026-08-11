import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Barcode,
    Boxes,
    Building2,
    CalendarClock,
    Camera,
    ClipboardList,
    FileText,
    Hash,
    History,
    MapPin,
    Package,
    Pencil,
    ShieldCheck,
    ShoppingBag,
    Tags,
    Trash2,
    UserRound,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Barcode as AssetBarcode } from '@/components/assets/barcode';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    destroy,
    edit as editRoute,
    index as indexRoute,
    labels as labelsRoute,
} from '@/routes/assets';

type Classification = {
    id: string;
    code: string | null;
    name: string;
};

type AssetDetail = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    part_number: string | null;
    status: string;
    condition: string | null;
    purchase_date: string | null;
    purchase_price: string | null;
    in_come_date: string | null;
    broken_date: string | null;
    warranty_expire: string | null;
    garansi_exp: string | null;
    no_spb: string | null;
    document_number: string | null;
    pic: string[];
    notes: string | null;
    vendor_name: string | null;
    photo_url: string[];
    document_url: string[];
    created_at: string;
    item: { id: string; name: string; code: string } | null;
    location: { id: string; name: string } | null;
    department: { id_department: string; nama_department: string } | null;
    asset_group: Classification | null;
    asset_category: Classification | null;
    asset_cluster: Classification | null;
    asset_sub_cluster: Classification | null;
    histories: HistoryEntry[];
};

type HistoryEntry = {
    id: string;
    field: string;
    old_value: string | null;
    new_value: string | null;
    changed_by_name: string | null;
    created_at: string;
};

type PageProps = {
    asset: AssetDetail;
};

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    INACTIVE:
        'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
    DISPOSED:
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Aktif',
    INACTIVE: 'Nonaktif',
    DISPOSED: 'Dihapus',
};

const CONDITION_STYLES: Record<string, string> = {
    Baik: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    'Rusak Ringan':
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'Rusak Berat':
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

const CHAIN_ACCENTS = [
    'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    'bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300',
];

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

const FIELD_LABELS: Record<string, string> = {
    status: 'Status',
    condition: 'Kondisi',
    location_id: 'Lokasi',
    department_id: 'Department',
    pic: 'PIC',
    kode_asset: 'Kode Aset',
};

function formatHistoryTime(value: string): string {
    return new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPrice(value: string | null): string {
    if (value === null || value === '') {
        return '—';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function DetailItem({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                <Icon className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-0.5 truncate text-sm font-semibold text-foreground',
                        mono && 'font-mono tabular-nums',
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="glass-panel card-enter rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                    <Icon className="size-4 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

export default function AssetShow() {
    const { asset } = usePage().props as unknown as PageProps;

    const [photoIndex, setPhotoIndex] = useState(0);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const chain = [
        asset.asset_group,
        asset.asset_category,
        asset.asset_cluster,
        asset.asset_sub_cluster,
    ].filter(Boolean) as Classification[];

    const hasDocuments = asset.document_url.length > 0;
    const hasPhotos = asset.photo_url.length > 0;

    const handleDelete = () => {
        setDeleting(true);

        router.delete(destroy(asset.id).url, {
            onSuccess: () => {
                setDeleting(false);
                setDeleteOpen(false);
                toast.success('Aset berhasil dihapus.');
            },
            onError: () => {
                setDeleting(false);
                toast.error('Gagal menghapus aset.');
            },
        });
    };

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]"
            />
            <div className="mx-auto w-full max-w-5xl">
                <Link
                    href={indexRoute().url}
                    className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Kembali ke Daftar Aset
                </Link>

                <div className="card-enter mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="relative size-16 shrink-0">
                            {hasPhotos ? (
                                <img
                                    src={asset.photo_url[0]}
                                    alt="Foto aset"
                                    className="size-16 rounded-2xl border border-border/70 object-cover shadow-md ring-1 ring-primary/10"
                                />
                            ) : (
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                    <Boxes
                                        className="size-7"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {asset.item?.name ?? 'Aset'}
                                </h1>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1',
                                        STATUS_STYLES[asset.status] ??
                                            STATUS_STYLES.INACTIVE,
                                    )}
                                >
                                    {STATUS_LABELS[asset.status] ??
                                        asset.status}
                                </span>
                            </div>
                            <p className="mt-1 truncate font-mono text-sm font-bold text-primary tabular-nums">
                                {asset.kode_asset ?? '—'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {[asset.brand, asset.model]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        <Link
                            href={labelsRoute().url}
                            data={{ ids: [asset.id] }}
                            className="inline-flex"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 rounded-xl"
                            >
                                <Barcode className="size-4" />
                                Cetak Barcode
                            </Button>
                        </Link>
                        <Link href={editRoute(asset.id).url}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 rounded-xl"
                            >
                                <Pencil className="size-4" />
                                Edit Aset
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-2 rounded-xl"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                    {chain.length > 0 ? (
                        chain.map((level, chainIndex) => (
                            <span
                                key={`${level.id}-${chainIndex}`}
                                className={cn(
                                    'inline-flex max-w-52 items-center gap-1.5 truncate rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
                                    CHAIN_ACCENTS[
                                        chainIndex % CHAIN_ACCENTS.length
                                    ],
                                )}
                            >
                                <Hash
                                    className="size-3 shrink-0"
                                    strokeWidth={2}
                                />
                                <span className="truncate">
                                    {[level.code, level.name]
                                        .filter(Boolean)
                                        .join(' — ')}
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Belum ada klasifikasi
                        </span>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <Section
                            icon={Camera}
                            title="Foto Aset"
                            description={
                                hasPhotos
                                    ? `${asset.photo_url.length} foto`
                                    : undefined
                            }
                        >
                            {hasPhotos ? (
                                <div className="space-y-3">
                                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm">
                                        <img
                                            src={asset.photo_url[photoIndex]}
                                            alt="Foto aset"
                                            className="aspect-[16/10] w-full object-cover"
                                        />
                                    </div>
                                    {asset.photo_url.length > 1 && (
                                        <div className="flex gap-2">
                                            {asset.photo_url.map(
                                                (photo, index) => (
                                                    <button
                                                        key={photo}
                                                        type="button"
                                                        onClick={() =>
                                                            setPhotoIndex(index)
                                                        }
                                                        className={cn(
                                                            'relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-all duration-200',
                                                            index === photoIndex
                                                                ? 'border-primary/60 ring-2 ring-primary/30'
                                                                : 'border-border/70 opacity-70 hover:opacity-100',
                                                        )}
                                                        aria-label={`Lihat foto ${index + 1}`}
                                                    >
                                                        <img
                                                            src={photo}
                                                            alt={`Foto aset ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-background/40 py-12 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Camera
                                            className="size-5"
                                            strokeWidth={1.75}
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Belum ada foto aset
                                    </p>
                                </div>
                            )}
                        </Section>

                        <Section
                            icon={Package}
                            title="Informasi Produk"
                            description="Identitas dan spesifikasi perangkat atau barang."
                        >
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <DetailItem
                                    icon={Tags}
                                    label="Item"
                                    value={asset.item?.name ?? '—'}
                                />
                                <DetailItem
                                    icon={Hash}
                                    label="Kode Aset"
                                    value={asset.kode_asset ?? '—'}
                                    mono
                                />
                                <DetailItem
                                    icon={Package}
                                    label="Serial Number"
                                    value={asset.serial_number ?? '—'}
                                    mono
                                />
                                <DetailItem
                                    icon={Package}
                                    label="Part Number"
                                    value={asset.part_number ?? '—'}
                                    mono
                                />
                                <DetailItem
                                    icon={ShieldCheck}
                                    label="Brand"
                                    value={asset.brand ?? '—'}
                                />
                                <DetailItem
                                    icon={ShieldCheck}
                                    label="Model"
                                    value={asset.model ?? '—'}
                                />
                            </div>
                        </Section>

                        <Section
                            icon={ShoppingBag}
                            title="Pembelian & Penempatan"
                            description="Detail transaksi serta lokasi pemakaian aset."
                        >
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <DetailItem
                                    icon={CalendarClock}
                                    label="Tanggal Pembelian"
                                    value={formatDate(asset.purchase_date)}
                                />
                                <DetailItem
                                    icon={Wallet}
                                    label="Harga Pembelian"
                                    value={formatPrice(asset.purchase_price)}
                                />
                                <DetailItem
                                    icon={UserRound}
                                    label="Vendor"
                                    value={asset.vendor_name ?? '—'}
                                />
                                <DetailItem
                                    icon={MapPin}
                                    label="Lokasi"
                                    value={asset.location?.name ?? '—'}
                                />
                                <DetailItem
                                    icon={Building2}
                                    label="Department"
                                    value={
                                        asset.department?.nama_department ?? '—'
                                    }
                                />
                            </div>
                        </Section>

                        <Section
                            icon={CalendarClock}
                            title="Garansi & Siklus Hidup"
                            description="Tanggal penting untuk pengelolaan dan pemeliharaan."
                        >
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                                <DetailItem
                                    icon={CalendarClock}
                                    label="Tanggal Masuk"
                                    value={formatDate(asset.in_come_date)}
                                />
                                <DetailItem
                                    icon={CalendarClock}
                                    label="Garansi (habis)"
                                    value={formatDate(asset.warranty_expire)}
                                />
                                <DetailItem
                                    icon={CalendarClock}
                                    label="Garansi Vendor (habis)"
                                    value={formatDate(asset.garansi_exp)}
                                />
                                <DetailItem
                                    icon={CalendarClock}
                                    label="Tanggal Rusak"
                                    value={formatDate(asset.broken_date)}
                                />
                            </div>
                        </Section>
                    </div>

                    <div className="space-y-4">
                        <section className="glass-panel card-enter rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                                    <Barcode
                                        className="size-4 text-primary"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                        Barcode Aset
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5">
                                {asset.kode_asset ? (
                                    <>
                                        <div className="rounded-xl border border-border/70 bg-card/60 p-4">
                                            <AssetBarcode
                                                value={asset.kode_asset}
                                                className="h-20"
                                            />
                                            <p className="mt-2 text-center font-mono text-sm font-bold text-foreground tabular-nums">
                                                {asset.kode_asset}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada kode aset.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="glass-panel card-enter rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                                    <ClipboardList
                                        className="size-4 text-primary"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                        Status & Kondisi
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Status
                                    </p>
                                    <span
                                        className={cn(
                                            'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1',
                                            STATUS_STYLES[asset.status] ??
                                                STATUS_STYLES.INACTIVE,
                                        )}
                                    >
                                        {STATUS_LABELS[asset.status] ??
                                            asset.status}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Kondisi
                                    </p>
                                    <span
                                        className={cn(
                                            'mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1',
                                            CONDITION_STYLES[
                                                asset.condition ?? ''
                                            ] ??
                                                'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
                                        )}
                                    >
                                        {asset.condition ?? '—'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="glass-panel card-enter rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                                    <FileText
                                        className="size-4 text-primary"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                        Dokumen & Referensi
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5 space-y-3">
                                <DetailItem
                                    icon={FileText}
                                    label="No. SPB"
                                    value={asset.no_spb ?? '—'}
                                    mono
                                />
                                <DetailItem
                                    icon={FileText}
                                    label="Nomor Dokumen"
                                    value={asset.document_number ?? '—'}
                                    mono
                                />
                                <div>
                                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Dokumen Pendukung
                                    </p>
                                    {hasDocuments ? (
                                        <div className="mt-2 space-y-1.5">
                                            {asset.document_url.map(
                                                (document, index) => (
                                                    <a
                                                        key={document}
                                                        href={document}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                                                    >
                                                        <FileText
                                                            className="size-3.5 shrink-0"
                                                            strokeWidth={2}
                                                        />
                                                        <span className="truncate">
                                                            Dokumen {index + 1}
                                                        </span>
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Tidak ada
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="glass-panel card-enter rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                                    <UserRound
                                        className="size-4 text-primary"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                        Penanggung Jawab
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5">
                                {asset.pic.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {asset.pic.map((person) => (
                                            <span
                                                key={person}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                                            >
                                                <UserRound
                                                    className="size-3"
                                                    strokeWidth={2}
                                                />
                                                {person}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="glass-panel card-enter rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                                    <ClipboardList
                                        className="size-4 text-primary"
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                        Catatan
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5">
                                {asset.notes ? (
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                        {asset.notes}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Tidak ada catatan.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <section className="glass-panel card-enter mt-4 rounded-2xl p-5 delay-200 md:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                            <History
                                className="size-4 text-primary"
                                strokeWidth={1.75}
                            />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-tight text-foreground">
                                Riwayat Siklus Hidup
                            </h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Perubahan status, kondisi, penempatan, dan PIC
                                tercatat di sini.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        {asset.histories.length > 0 ? (
                            <ol className="relative space-y-5 border-l border-border/70 pl-5">
                                {asset.histories.map((entry) => (
                                    <li key={entry.id} className="relative">
                                        <span
                                            aria-hidden
                                            className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-background bg-primary shadow-sm"
                                        />
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-foreground">
                                                {FIELD_LABELS[entry.field] ??
                                                    entry.field}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground tabular-nums">
                                                {formatHistoryTime(
                                                    entry.created_at,
                                                )}
                                            </p>
                                        </div>
                                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                            {entry.old_value
                                                ? `${entry.old_value} → ${entry.new_value}`
                                                : (entry.new_value ?? '—')}
                                        </p>
                                        {entry.changed_by_name ? (
                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                oleh {entry.changed_by_name}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada riwayat perubahan.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Aset</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus aset &ldquo;
                            {asset.kode_asset ?? asset.item?.name}
                            &rdquo;? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <Trash2 className="mr-2 size-4" />
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

AssetShow.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Aset',
            href: indexRoute().url,
        },
    ],
};
