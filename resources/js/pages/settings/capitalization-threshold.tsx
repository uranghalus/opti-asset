import { router, Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import CapitalizationThresholdController from '@/actions/App/Http/Controllers/Settings/CapitalizationThresholdController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type Threshold = {
    id: number;
    amount: string;
    currency: string;
    is_active: boolean;
    activated_at: string | null;
    created_at: string;
    creator?: { id: number; name: string } | null;
};

type PageProps = {
    thresholds: Threshold[];
    activeThreshold: Threshold | null;
};

const formatAmount = (value: string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

const formatDate = (value: string | null) =>
    value
        ? new Date(value).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : '—';

export default function CapitalizationThreshold({
    thresholds,
    activeThreshold,
}: PageProps) {
    const [currency, setCurrency] = useState(
        activeThreshold?.currency ?? 'IDR',
    );
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [reassigning, setReassigning] = useState(false);

    const handleDelete = (id: number) => {
        setDeletingId(id);

        router.delete(
            CapitalizationThresholdController.destroy.url({ threshold: id }),
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Riwayat ambang batas dihapus.'),
                onError: () => toast.error('Gagal menghapus ambang batas.'),
                onFinish: () => setDeletingId(null),
            },
        );
    };

    const handleReassign = () => {
        setReassigning(true);

        router.post(
            CapitalizationThresholdController.reassignTypes.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Tipe aset berhasil dihitung ulang.'),
                onError: () => toast.error('Gagal menghitung ulang tipe aset.'),
                onFinish: () => setReassigning(false),
            },
        );
    };

    return (
        <>
            <Head title="Ambang Batas Kapitalisasi" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Ambang Batas Kapitalisasi"
                    description="Menentukan batas nilai perolehan antara Aktiva Tetap dan Peralatan. Aset dengan nilai perolehan ≥ ambang batas otomatis menjadi Aktiva Tetap."
                />

                <Card className="soft-card">
                    <CardHeader>
                        <CardTitle>Ambang Batas Aktif</CardTitle>
                        <CardDescription className="text-text-tertiary">
                            {activeThreshold
                                ? `Saat ini ${formatAmount(activeThreshold.amount)} (${activeThreshold.currency})`
                                : 'Belum ada ambang batas aktif — semua aset baru dikategorikan sebagai Peralatan.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...CapitalizationThresholdController.store.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount" className="text-text-secondary">
                                                Nilai Ambang Batas
                                            </Label>
                                            <Input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                defaultValue={
                                                    activeThreshold?.amount ??
                                                    ''
                                                }
                                                placeholder="Contoh: 5000000"
                                            />
                                            {errors.amount && (
                                                <p className="text-sm text-destructive">
                                                    {errors.amount}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="currency" className="text-text-secondary">
                                                Mata Uang
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="currency"
                                                value={currency}
                                            />
                                            <Select
                                                value={currency}
                                                onValueChange={setCurrency}
                                            >
                                                <SelectTrigger id="currency">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="IDR">
                                                        IDR — Rupiah
                                                    </SelectItem>
                                                    <SelectItem value="USD">
                                                        USD — Dolar AS
                                                    </SelectItem>
                                                    <SelectItem value="EUR">
                                                        EUR — Euro
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.currency && (
                                                <p className="text-sm text-destructive">
                                                    {errors.currency}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        variant="soft-primary"
                                    >
                                        {processing && (
                                            <Spinner className="mr-2 size-4" />
                                        )}
                                        Simpan Ambang Batas
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <Card className="soft-card">
                    <CardHeader>
                        <CardTitle>Riwayat Ambang Batas</CardTitle>
                        <CardDescription className="text-text-tertiary">
                            Perubahan tidak berlaku surut — gunakan tombol
                            hitung ulang untuk menerapkan ke aset yang sudah
                            ada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {thresholds.length === 0 ? (
                            <p className="text-sm text-text-tertiary">
                                Belum ada riwayat ambang batas.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-subtle text-left text-xs font-medium text-text-tertiary">
                                            <th className="py-2 pr-4">
                                                Nilai
                                            </th>
                                            <th className="py-2 pr-4">
                                                Ditetapkan
                                            </th>
                                            <th className="py-2 pr-4">
                                                Oleh
                                            </th>
                                            <th className="py-2 pr-4">
                                                Status
                                            </th>
                                            <th className="py-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {thresholds.map((threshold) => (
                                            <tr
                                                key={threshold.id}
                                                className="border-b border-border-subtle/70 last:border-b-0"
                                            >
                                                <td className="py-2.5 pr-4 font-medium text-text-primary">
                                                    {formatAmount(
                                                        threshold.amount,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-text-tertiary">
                                                    {formatDate(
                                                        threshold.activated_at,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-text-tertiary">
                                                    {threshold.creator?.name ??
                                                        '—'}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    {threshold.is_active ? (
                                                        <Badge variant="soft">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="soft-pill"
                                                            className="border border-border-subtle bg-surface-card text-text-tertiary shadow-flat"
                                                        >
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    {!threshold.is_active && (
                                                        <Button
                                                            variant="soft-secondary"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={
                                                                deletingId ===
                                                                threshold.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    threshold.id,
                                                                )
                                                            }
                                                        >
                                                            {deletingId ===
                                                            threshold.id ? (
                                                                <Spinner className="size-3.5" />
                                                            ) : (
                                                                'Hapus'
                                                            )}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="soft-card">
                    <CardHeader>
                        <CardTitle>Hitung Ulang Tipe Aset</CardTitle>
                        <CardDescription className="text-text-tertiary">
                            Terapkan ambang batas aktif ke seluruh aset yang
                            tidak di-override manual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="soft-secondary"
                            onClick={handleReassign}
                            disabled={reassigning}
                        >
                            {reassigning && <Spinner className="mr-2 size-4" />}
                            Hitung Ulang Semua Aset
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
