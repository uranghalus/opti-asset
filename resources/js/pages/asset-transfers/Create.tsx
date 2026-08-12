import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Hash, MapPin, Package, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as indexRoute } from '@/routes/asset-transfers';

type Asset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
};

type Location = {
    id: string;
    name: string;
};

type Department = {
    id_department: string;
    nama_department: string;
};

type Employee = {
    id_employee: string;
    nama_employee: string;
};

type TransferForm = {
    asset_id: string;
    to_location_id: string;
    to_department_id: string;
    to_user_id: string;
    quantity: number;
    notes: string;
};

type PageProps = {
    assets: Asset[];
    locations: Location[];
    departments: Department[];
    employees: Employee[];
};

export default function AssetTransferCreate() {
    const { assets, locations, departments, employees } = usePage()
        .props as unknown as PageProps;
    const form = useForm<TransferForm>({
        asset_id: '',
        to_location_id: '',
        to_department_id: '',
        to_user_id: '',
        quantity: 1,
        notes: '',
    });

    const selectedAssetData = assets.find((a) => a.id === form.data.asset_id);

    const handleAssetChange = (value: string) => {
        form.setData('asset_id', value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!form.data.asset_id) {
            toast.error('Pilih aset yang akan ditransfer.');

            return;
        }

        if (!form.data.to_location_id) {
            toast.error('Pilih lokasi tujuan.');

            return;
        }

        form.post(indexRoute().url, {
            preserveState: true,
        });
    };

    return (
        <>
            <Head title="Ajukan Mutasi Aset" />

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <div
                    aria-hidden
                    className="dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.16),transparent_60%),radial-gradient(50%_45%_at 100%_100%,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(245,158,11,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(16,185,129,0.1),transparent_60%)]"
                />
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            asChild
                        >
                            <Link href={indexRoute().url}>
                                <ArrowLeft className="mr-1 size-4" />
                                Kembali
                            </Link>
                        </Button>
                    </div>

                    <div className="glass-panel relative flex flex-col gap-3 rounded-2xl p-6">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-emerald-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Package className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Ajukan Mutasi Aset
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Isi formulir di bawah untuk memindahkan aset
                                    ke lokasi, departemen, atau pengguna
                                    lainnya.
                                </p>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-6 grid gap-5"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="asset-id">Aset *</Label>
                                <Select
                                    value={form.data.asset_id}
                                    onValueChange={handleAssetChange}
                                    disabled={form.processing}
                                >
                                    <SelectTrigger
                                        id="asset-id"
                                        className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                    >
                                        <SelectValue placeholder="Pilih aset" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 max-w-full">
                                        {assets.map((asset) => (
                                            <SelectItem
                                                key={asset.id}
                                                value={asset.id}
                                            >
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="font-mono text-xs">
                                                        {asset.kode_asset ??
                                                            asset.serial_number ??
                                                            '-'}
                                                    </span>
                                                    <span className="text-sm">
                                                        {asset.brand
                                                            ? `${asset.brand} ${asset.model ?? ''}`
                                                            : 'Tanpa nama'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.asset_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.asset_id}
                                    </p>
                                )}
                            </div>

                            {selectedAssetData && (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                            <Hash
                                                className="size-5"
                                                strokeWidth={1.75}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-foreground">
                                                {selectedAssetData?.kode_asset ??
                                                    selectedAssetData?.serial_number ??
                                                    'Aset'}
                                            </p>
                                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                {selectedAssetData?.brand
                                                    ? `${selectedAssetData.brand} ${selectedAssetData?.model ?? ''}`
                                                    : 'Tanpa nama aset'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="to-location-id">
                                    Lokasi Tujuan *
                                </Label>
                                <Select
                                    value={form.data.to_location_id}
                                    onValueChange={(value) =>
                                        form.setData('to_location_id', value)
                                    }
                                    disabled={form.processing}
                                >
                                    <SelectTrigger
                                        id="to-location-id"
                                        className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                    >
                                        <SelectValue placeholder="Pilih lokasi tujuan" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 max-w-full">
                                        {locations.map((location) => (
                                            <SelectItem
                                                key={location.id}
                                                value={location.id}
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                                    {location.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.to_location_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.to_location_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="to-department-id">
                                    Departemen Tujuan
                                </Label>
                                <Select
                                    value={form.data.to_department_id}
                                    onValueChange={(value) =>
                                        form.setData('to_department_id', value)
                                    }
                                    disabled={form.processing}
                                >
                                    <SelectTrigger
                                        id="to-department-id"
                                        className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                    >
                                        <SelectValue placeholder="Pilih departemen (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 max-w-full">
                                        {departments.map((dept) => (
                                            <SelectItem
                                                key={dept.id_department}
                                                value={dept.id_department}
                                            >
                                                {dept.nama_department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.to_department_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.to_department_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="to-user-id">
                                    Pengguna Tujuan
                                </Label>
                                <Select
                                    value={form.data.to_user_id}
                                    onValueChange={(value) =>
                                        form.setData('to_user_id', value)
                                    }
                                    disabled={form.processing}
                                >
                                    <SelectTrigger
                                        id="to-user-id"
                                        className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                    >
                                        <SelectValue placeholder="Pilih pengguna (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 max-w-full">
                                        {employees.map((emp) => (
                                            <SelectItem
                                                key={emp.id_employee}
                                                value={emp.id_employee}
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <User className="size-4 shrink-0 text-muted-foreground" />
                                                    {emp.nama_employee}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.to_user_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.to_user_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Kuantitas</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={form.data.quantity}
                                    onChange={(e) =>
                                        form.setData(
                                            'quantity',
                                            parseInt(e.target.value) || 1,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                />
                                {form.errors.quantity && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.quantity}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Alasan mutasi, keterangan tambahan..."
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                    disabled={form.processing}
                                    className="min-h-[100px] rounded-xl border-border/70 bg-card/70 text-sm shadow-sm"
                                />
                                {form.errors.notes && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.notes}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                    Tanggal pengajuan:{' '}
                                    {new Date().toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    disabled={form.processing}
                                    className="rounded-xl"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl"
                                >
                                    {form.processing
                                        ? 'Mengajukan...'
                                        : 'Ajukan Mutasi'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

AssetTransferCreate.layout = {
    breadcrumbs: [
        {
            title: 'Mutasi Aset',
            href: indexRoute().url,
        },
        {
            title: 'Ajukan Mutasi',
            href: '#',
        },
    ],
};
