import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, History, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from '@/components/ui/table';

type HistoryEntry = {
    id: string;
    field: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null;
    changed_by_name: string | null;
    created_at: string;
};

const FIELD_LABELS: Record<string, string> = {
    status: 'Status',
    condition: 'Kondisi',
    location_id: 'Lokasi',
    department_id: 'Departemen',
    assigned_user_id: 'Pengguna',
    brand: 'Merek',
    model: 'Model',
    serial_number: 'Nomor Seri',
    purchase_date: 'Tanggal Pembelian',
    purchase_price: 'Harga Pembelian',
    kode_asset: 'Kode Aset',
    asset_group_id: 'Golongan',
    asset_category_id: 'Kategori',
    asset_cluster_id: 'Cluster',
    asset_sub_cluster_id: 'Sub Cluster',
};

function formatValue(value: string | null): string {
    if (!value) {
        return '—';
    }

    if (value === 'true') {
        return 'Ya';
    }

    if (value === 'false') {
        return 'Tidak';
    }

    return value;
}

function getFieldLabel(field: string): string {
    return FIELD_LABELS[field] ?? field;
}

export default function AssetHistoryIndex() {
    const { asset, histories } = usePage().props as unknown as {
        asset: {
            id: string;
            kode_asset: string | null;
            item: { id: string; name: string; code: string } | null;
            location: { id: string; name: string } | null;
            department: {
                id_department: string;
                nama_department: string;
            } | null;
        };
        histories: {
            data: Array<{
                id: string;
                field: string;
                old_value: string | null;
                new_value: string | null;
                changed_by: string | null;
                changed_by_name: string | null;
                created_at: string;
            }>;
            current_page: number;
            last_page: number;
            total: number;
            from: number | null;
            to: number | null;
            links: { url: string | null; label: string; active: boolean }[];
        };
    };

    const goBack = () => {
        router.visit(`/assets/${asset.id}`);
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, replace: true });
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]"
            />
            <div className="mx-auto w-full max-w-6xl">
                <div className="card-enter flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
                            onClick={goBack}
                            aria-label="Kembali ke detail aset"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Riwayat Aset
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {asset.item?.name ?? 'Aset'}{' '}
                                {asset.kode_asset
                                    ? `(${asset.kode_asset})`
                                    : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {asset.location && (
                                <>
                                    <MapPin className="size-4" />
                                    <span>{asset.location.name}</span>
                                </>
                            )}
                            {asset.department && (
                                <>
                                    <Building2 className="size-4" />
                                    <span>
                                        {asset.department.nama_department}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-enter mt-7 flex flex-col gap-3 rounded-2xl p-3 delay-100 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                        <History className="size-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Riwayat Perubahan
                        </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">
                            Total: {histories.total} catatan
                        </span>
                    </div>
                </div>

                {histories.data.length === 0 ? (
                    <div className="glass-panel card-enter mt-4 flex flex-col items-center justify-center gap-4 py-20 text-center delay-200">
                        <div className="glass-card flex size-16 items-center justify-center rounded-2xl text-primary shadow-md">
                            <History className="size-7" strokeWidth={1.25} />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground">
                                Belum ada riwayat
                            </p>
                            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                Riwayat perubahan akan muncul di sini setelah
                                aset mengalami perubahan.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="card-enter mt-4 overflow-hidden rounded-2xl delay-200">
                            <Table className="w-full">
                                <TableHeader>
                                    <tr className="border-b border-border/40 text-xs tracking-wide text-muted-foreground uppercase">
                                        <th className="px-4 py-3 font-semibold">
                                            Waktu
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Field
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Nilai Lama
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Nilai Baru
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Diubah Oleh
                                        </th>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {histories.data.map((history) => (
                                        <TableRow
                                            key={history.id}
                                            className="border-b border-border/30 transition-colors last:border-0 hover:bg-accent/30"
                                        >
                                            <TableCell className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                                                {new Date(
                                                    history.created_at,
                                                ).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 font-medium text-foreground">
                                                {getFieldLabel(history.field)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {formatValue(history.old_value)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 font-mono text-xs text-foreground">
                                                {formatValue(history.new_value)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                                                {history.changed_by_name ??
                                                    'Sistem'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {histories.last_page > 1 && (
                            <div className="card-enter mt-6 flex flex-col items-center justify-between gap-3 delay-200 sm:flex-row">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan {histories.from}–{histories.to}{' '}
                                    dari {histories.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl"
                                        disabled={!histories.links[0]?.url}
                                        onClick={() =>
                                            goToPage(histories.links[0]?.url)
                                        }
                                    >
                                        Sebelumnya
                                    </Button>
                                    {histories.links
                                        .slice(1, -1)
                                        .map((link, i) => (
                                            <Button
                                                key={i}
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="icon"
                                                className="h-9 w-9 rounded-xl"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    goToPage(link.url)
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl"
                                        disabled={
                                            !histories.links[
                                                histories.links.length - 1
                                            ]?.url
                                        }
                                        onClick={() =>
                                            goToPage(
                                                histories.links[
                                                    histories.links.length - 1
                                                ]?.url,
                                            )
                                        }
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

AssetHistoryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Aset',
            href: '/assets',
        },
        {
            title: 'Detail Aset',
            href: `/assets/{asset.id}`,
        },
        {
            title: 'Riwayat',
        },
    ],
};
