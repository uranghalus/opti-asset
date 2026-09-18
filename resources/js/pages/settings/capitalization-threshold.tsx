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

                <Card>
                    <CardHeader>
                        <CardTitle>Ambang Batas Aktif</CardTitle>
                        <CardDescription>
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
                                            <Label htmlFor="amount">
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
                                            <Label htmlFor="currency">
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
                                    <Button type="submit" disabled={processing}>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Ambang Batas</CardTitle>
                        <CardDescription>
                            Perubahan tidak berlaku surut — gunakan tombol
                            hitung ulang untuk menerapkan ke aset yang sudah
                            ada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {thresholds.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada riwayat ambang batas.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-4 font-medium">
                                                Nilai
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Ditetapkan
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Oleh
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Status
                                            </th>
                                            <th className="py-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {thresholds.map((threshold) => (
                                            <tr
                                                key={threshold.id}
                                                className="border-b last:border-b-0"
                                            >
                                                <td className="py-2.5 pr-4 font-medium">
                                                    {formatAmount(
                                                        threshold.amount,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-muted-foreground">
                                                    {formatDate(
                                                        threshold.activated_at,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-muted-foreground">
                                                    {threshold.creator?.name ??
                                                        '—'}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    {threshold.is_active ? (
                                                        <Badge>Aktif</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    {!threshold.is_active && (
                                                        <Button
                                                            variant="ghost"
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

                <Card>
                    <CardHeader>
                        <CardTitle>Hitung Ulang Tipe Aset</CardTitle>
                        <CardDescription>
                            Terapkan ambang batas aktif ke seluruh aset yang
                            tidak di-override manual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
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
