import { useForm } from '@inertiajs/react';
import { CircleAlert, Layers, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/assets';

export type AssetOption = {
    id: string;
    code: string | null;
    name: string;
    asset_group_id?: string;
    asset_category_id?: string;
    asset_cluster_id?: string;
};

export type AssetInitial = {
    id: string;
    kode_asset: string | null;
    item_id: string | null;
    condition: string | null;
    purchase_date: string | null;
    purchase_price: string | null;
    location_id: string | null;
    department_id: string | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    status: string;
    notes: string | null;
    asset_group_id: string | null;
    asset_category_id: string | null;
    asset_cluster_id: string | null;
    asset_sub_cluster_id: string | null;
};

type AssetFormProps = {
    mode: 'create' | 'edit';
    asset?: AssetInitial;
    groups: AssetOption[];
    categories: AssetOption[];
    clusters: AssetOption[];
    subClusters: AssetOption[];
    items: { id: string; name: string; code: string }[];
    locations: { id: string; name: string }[];
    departments: { id_department: string; nama_department: string }[];
};

const ASSET_OPTIONS = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
    { value: 'DISPOSED', label: 'Dihapus' },
];

function lastSegment(code: string | null | undefined): string {
    if (!code) {
        return '';
    }

    return code.split('.').at(-1) ?? code;
}

function buildAssetCode(
    group?: AssetOption | null,
    category?: AssetOption | null,
    cluster?: AssetOption | null,
    subCluster?: AssetOption | null,
    sequence = 1,
): string {
    const segments = [group, category, cluster, subCluster].map((c) =>
        lastSegment(c?.code),
    );

    return segments.every((s) => s !== '')
        ? `${segments.join('.')}.${String(sequence).padStart(3, '0')}`
        : '';
}

export function AssetForm({
    mode,
    asset,
    groups,
    categories,
    clusters,
    subClusters,
    items,
    locations,
    departments,
}: AssetFormProps) {
    const [selGroup, setSelGroup] = useState(asset?.asset_group_id ?? '');
    const [selCategory, setSelCategory] = useState(
        asset?.asset_category_id ?? '',
    );
    const [selCluster, setSelCluster] = useState(asset?.asset_cluster_id ?? '');
    const [selSubCluster, setSelSubCluster] = useState(
        asset?.asset_sub_cluster_id ?? '',
    );

    const form = useForm({
        item_id: asset?.item_id ?? '',
        condition: asset?.condition ?? '',
        purchase_date: asset?.purchase_date ?? '',
        purchase_price: asset?.purchase_price ?? '',
        in_come_date: '',
        broken_date: '',
        warranty_expire: '',
        location_id: asset?.location_id ?? '',
        department_id: asset?.department_id ?? '',
        assigned_user_id: '',
        assigned_status: 'AVAILABLE',
        brand: asset?.brand ?? '',
        model: asset?.model ?? '',
        part_number: '',
        serial_number: asset?.serial_number ?? '',
        no_spb: '',
        document_number: '',
        pic: '',
        notes: asset?.notes ?? '',
        photo_url: '',
        document_url: '',
        garansi_exp: '',
        status: asset?.status ?? 'ACTIVE',
        vendor_name: '',
        asset_group_id: asset?.asset_group_id ?? '',
        asset_category_id: asset?.asset_category_id ?? '',
        asset_cluster_id: asset?.asset_cluster_id ?? '',
        asset_sub_cluster_id: asset?.asset_sub_cluster_id ?? '',
    });

    const filteredCategories = useMemo(
        () => categories.filter((c) => c.asset_group_id === selGroup),
        [categories, selGroup],
    );
    const filteredClusters = useMemo(
        () => clusters.filter((c) => c.asset_category_id === selCategory),
        [clusters, selCategory],
    );
    const filteredSubClusters = useMemo(
        () => subClusters.filter((c) => c.asset_cluster_id === selCluster),
        [subClusters, selCluster],
    );

    const previewCode = buildAssetCode(
        groups.find((g) => g.id === selGroup),
        categories.find((c) => c.id === selCategory),
        clusters.find((c) => c.id === selCluster),
        subClusters.find((c) => c.id === selSubCluster),
    );

    const handleSelectGroup = (value: string) => {
        setSelGroup(value);
        setSelCategory('');
        setSelCluster('');
        setSelSubCluster('');
        form.setData((prev) => ({
            ...prev,
            asset_group_id: value,
            asset_category_id: '',
            asset_cluster_id: '',
            asset_sub_cluster_id: '',
        }));
    };

    const handleSelectCategory = (value: string) => {
        setSelCategory(value);
        setSelCluster('');
        setSelSubCluster('');
        form.setData((prev) => ({
            ...prev,
            asset_category_id: value,
            asset_cluster_id: '',
            asset_sub_cluster_id: '',
        }));
    };

    const handleSelectCluster = (value: string) => {
        setSelCluster(value);
        setSelSubCluster('');
        form.setData((prev) => ({
            ...prev,
            asset_cluster_id: value,
            asset_sub_cluster_id: '',
        }));
    };

    const handleSelectSubCluster = (value: string) => {
        setSelSubCluster(value);
        form.setData('asset_sub_cluster_id', value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !form.data.asset_group_id ||
            !form.data.asset_category_id ||
            !form.data.asset_cluster_id ||
            !form.data.asset_sub_cluster_id
        ) {
            toast.error(
                'Pilih golongan, kategori, cluster, dan sub cluster terlebih dahulu.',
            );

            return;
        }

        const options = {
            onSuccess: () => {
                toast.success(
                    mode === 'edit'
                        ? 'Aset berhasil diperbarui.'
                        : 'Aset berhasil ditambahkan.',
                );
            },
            onError: () => {
                toast.error('Periksa kembali data yang diisi.');
            },
        };

        if (mode === 'edit' && asset) {
            form.patch(update(asset.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                    <Layers className="size-3.5" />
                    Klasifikasi & Kode Aset
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="asset-group">Golongan</Label>
                        <Select
                            value={selGroup}
                            onValueChange={handleSelectGroup}
                        >
                            <SelectTrigger id="asset-group" className="mt-1.5">
                                <SelectValue placeholder="Pilih Golongan" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.code ? `${group.code} — ` : ''}
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="asset-category">Kategori</Label>
                        <Select
                            value={selCategory}
                            onValueChange={handleSelectCategory}
                            disabled={!selGroup}
                        >
                            <SelectTrigger
                                id="asset-category"
                                className="mt-1.5"
                            >
                                <SelectValue
                                    placeholder={
                                        selGroup
                                            ? 'Pilih Kategori'
                                            : 'Pilih Golongan dulu'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCategories.map((category) => (
                                    <SelectItem
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.code
                                            ? `${category.code} — `
                                            : ''}
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="asset-cluster">Cluster</Label>
                        <Select
                            value={selCluster}
                            onValueChange={handleSelectCluster}
                            disabled={!selCategory}
                        >
                            <SelectTrigger
                                id="asset-cluster"
                                className="mt-1.5"
                            >
                                <SelectValue
                                    placeholder={
                                        selCategory
                                            ? 'Pilih Cluster'
                                            : 'Pilih Kategori dulu'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredClusters.map((cluster) => (
                                    <SelectItem
                                        key={cluster.id}
                                        value={cluster.id}
                                    >
                                        {cluster.code
                                            ? `${cluster.code} — `
                                            : ''}
                                        {cluster.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="asset-sub-cluster">Sub Cluster</Label>
                        <Select
                            value={selSubCluster}
                            onValueChange={handleSelectSubCluster}
                            disabled={!selCluster}
                        >
                            <SelectTrigger
                                id="asset-sub-cluster"
                                className="mt-1.5"
                            >
                                <SelectValue
                                    placeholder={
                                        selCluster
                                            ? 'Pilih Sub Cluster'
                                            : 'Pilih Cluster dulu'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredSubClusters.map((subCluster) => (
                                    <SelectItem
                                        key={subCluster.id}
                                        value={subCluster.id}
                                    >
                                        {subCluster.code
                                            ? `${subCluster.code} — `
                                            : ''}
                                        {subCluster.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-background/60 px-4 py-3">
                    <Tags className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Kode Aset Otomatis
                        </p>
                        <p
                            className={cn(
                                'mt-0.5 font-mono text-lg font-bold tracking-tight tabular-nums',
                                previewCode
                                    ? 'text-primary'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {previewCode || '— . — . — . —'}
                        </p>
                    </div>
                </div>
                {form.errors.asset_sub_cluster_id && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <CircleAlert className="size-3.5" />
                        {form.errors.asset_sub_cluster_id}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <Label htmlFor="item">Item</Label>
                    <Select
                        value={form.data.item_id}
                        onValueChange={(value) =>
                            form.setData('item_id', value)
                        }
                    >
                        <SelectTrigger id="item" className="mt-1.5">
                            <SelectValue placeholder="Pilih Item (opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.code} — {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input
                        id="serial"
                        className="mt-1.5"
                        value={form.data.serial_number}
                        onChange={(e) =>
                            form.setData('serial_number', e.target.value)
                        }
                        placeholder="SN-XXXX"
                    />
                    {form.errors.serial_number && (
                        <p className="mt-1.5 text-xs font-medium text-destructive">
                            {form.errors.serial_number}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                        id="brand"
                        className="mt-1.5"
                        value={form.data.brand}
                        onChange={(e) => form.setData('brand', e.target.value)}
                        placeholder="Merk / brand"
                    />
                </div>
                <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                        id="model"
                        className="mt-1.5"
                        value={form.data.model}
                        onChange={(e) => form.setData('model', e.target.value)}
                        placeholder="Model / tipe"
                    />
                </div>
                <div>
                    <Label htmlFor="location">Lokasi</Label>
                    <Select
                        value={form.data.location_id}
                        onValueChange={(value) =>
                            form.setData('location_id', value)
                        }
                    >
                        <SelectTrigger id="location" className="mt-1.5">
                            <SelectValue placeholder="Pilih Lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((location) => (
                                <SelectItem
                                    key={location.id}
                                    value={location.id}
                                >
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                        value={form.data.department_id}
                        onValueChange={(value) =>
                            form.setData('department_id', value)
                        }
                    >
                        <SelectTrigger id="department" className="mt-1.5">
                            <SelectValue placeholder="Pilih Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((department) => (
                                <SelectItem
                                    key={department.id_department}
                                    value={department.id_department}
                                >
                                    {department.nama_department}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="purchase-date">Tanggal Pembelian</Label>
                    <Input
                        id="purchase-date"
                        type="date"
                        className="mt-1.5"
                        value={form.data.purchase_date}
                        onChange={(e) =>
                            form.setData('purchase_date', e.target.value)
                        }
                    />
                </div>
                <div>
                    <Label htmlFor="purchase-price">Harga Pembelian</Label>
                    <Input
                        id="purchase-price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1.5"
                        value={form.data.purchase_price}
                        onChange={(e) =>
                            form.setData('purchase_price', e.target.value)
                        }
                        placeholder="0"
                    />
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={form.data.status}
                        onValueChange={(value) => form.setData('status', value)}
                    >
                        <SelectTrigger id="status" className="mt-1.5">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {ASSET_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="sm:col-span-2">
                    <Label htmlFor="condition">Kondisi</Label>
                    <Input
                        id="condition"
                        className="mt-1.5"
                        value={form.data.condition}
                        onChange={(e) =>
                            form.setData('condition', e.target.value)
                        }
                        placeholder="Baik / Rusak Ringan / Rusak Berat"
                    />
                </div>
                <div className="sm:col-span-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Input
                        id="notes"
                        className="mt-1.5"
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Catatan tambahan"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    asChild={false}
                    onClick={() => history.back()}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner className="mr-2 size-4" />}
                    {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Aset'}
                </Button>
            </div>
        </form>
    );
}
