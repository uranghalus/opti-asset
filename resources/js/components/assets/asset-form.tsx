import { useForm } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    CalendarClock,
    Camera,
    CircleAlert,
    ClipboardList,
    FileText,
    MapPin,
    Package,
    ShoppingBag,
    Tags,
    UserRound,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MediaUploader } from '@/components/assets/media-uploader';
import { MultiSelect } from '@/components/multi-select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/assets';

export type AssetOption = {
    id: string;
    code: string;
    name: string;
    category_code: string | null;
};

export type AssetInitial = {
    id: string;
    kode_asset: string | null;
    item_id: string | null;
    condition: string | null;
    purchase_date: string | null;
    purchase_price: string | null;
    in_come_date: string | null;
    broken_date: string | null;
    warranty_expire: string | null;
    garansi_exp: string | null;
    location_id: string | null;
    department_id: string | null;
    brand: string | null;
    model: string | null;
    part_number: string | null;
    serial_number: string | null;
    no_spb: string | null;
    document_number: string | null;
    pic: string[];
    vendor_name: string | null;
    status: string;
    notes: string | null;
    photo_url: string[];
    document_url: string[];
};

type AssetFormProps = {
    mode: 'create' | 'edit';
    asset?: AssetInitial;
    items: AssetOption[];
    locations: { id: string; name: string }[];
    departments: { id_department: string; nama_department: string }[];
    employees: { id_employee: string; nama_employee: string }[];
    nextSequences: Record<string, number>;
};

const ASSET_OPTIONS = [
    { value: 'ACT', label: 'Aktif' },
    { value: 'LOAN', label: 'Dipinjamkan' },
    { value: 'RPR', label: 'Dalam Perbaikan' },
    { value: 'MUT', label: 'Dimutasi' },
    { value: 'DSP', label: 'Dihapus' },
];

const CONDITION_OPTIONS = [
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
];

function SectionHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
                <Icon className="size-4 text-primary" strokeWidth={1.75} />
            </div>
            <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    {title}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <CircleAlert className="size-3.5" />
            {message}
        </p>
    );
}

export function AssetForm({
    mode,
    asset,
    items,
    locations,
    departments,
    employees,
    nextSequences,
}: AssetFormProps) {
    const [photoBusy, setPhotoBusy] = useState(false);
    const [docBusy, setDocBusy] = useState(false);

    const mediaBusy = photoBusy || docBusy;

    const form = useForm({
        item_id: asset?.item_id ?? '',
        condition: asset?.condition ?? '',
        purchase_date: asset?.purchase_date ?? '',
        purchase_price: asset?.purchase_price ?? '',
        in_come_date: asset?.in_come_date ?? '',
        broken_date: asset?.broken_date ?? '',
        warranty_expire: asset?.warranty_expire ?? '',
        location_id: asset?.location_id ?? '',
        department_id: asset?.department_id ?? '',
        assigned_user_id: '',
        assigned_status: 'AVAILABLE',
        brand: asset?.brand ?? '',
        model: asset?.model ?? '',
        part_number: asset?.part_number ?? '',
        serial_number: asset?.serial_number ?? '',
        no_spb: asset?.no_spb ?? '',
        document_number: asset?.document_number ?? '',
        pic: asset?.pic ?? [],
        notes: asset?.notes ?? '',
        photo_url: asset?.photo_url ?? [],
        document_url: asset?.document_url ?? [],
        garansi_exp: asset?.garansi_exp ?? '',
        status: asset?.status ?? 'ACT',
        vendor_name: asset?.vendor_name ?? '',
    });

    const selectedItem = items.find((item) => item.id === form.data.item_id);

    const itemUnchanged =
        mode === 'edit' && asset?.item_id === form.data.item_id;

    const previewCode = itemUnchanged
        ? (asset?.kode_asset ?? '')
        : selectedItem?.category_code
          ? `${selectedItem.category_code}.${String(
                nextSequences[selectedItem.category_code] ?? 1,
            ).padStart(3, '0')}`
          : '';

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (mediaBusy) {
            toast.info('Tunggu hingga seluruh file selesai diunggah.');

            return;
        }

        if (!form.data.item_id) {
            toast.error('Pilih item terlebih dahulu.');

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
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-5">
                <SectionHeader
                    icon={Boxes}
                    title="Item Aset"
                    description="Pilih item (wajib). Kode aset dibuat otomatis dari kategori item."
                />

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-sm md:p-5">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label
                                htmlFor="item"
                                className="flex items-center gap-1"
                            >
                                Item
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.data.item_id}
                                onValueChange={(value) =>
                                    form.setData('item_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="item"
                                    className="mt-1.5 h-10 bg-background/70"
                                >
                                    <SelectValue placeholder="Pilih Item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {items.length === 0 ? (
                                        <SelectItem value="__none__" disabled>
                                            Tidak ada item tersedia
                                        </SelectItem>
                                    ) : (
                                        items.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code} — {item.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FieldError message={form.errors.item_id} />
                        </div>
                    </div>

                    <div
                        className={cn(
                            'mt-4 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                            previewCode
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-dashed border-border bg-background/40',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                                previewCode
                                    ? 'border-primary/30 bg-primary/15 text-primary'
                                    : 'border-border bg-background text-muted-foreground',
                            )}
                        >
                            <Tags className="size-4" strokeWidth={1.75} />
                        </div>
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
                                {previewCode || '—'}
                            </p>
                            {previewCode ? (
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                    Nomor urut dihitung otomatis per kategori
                                    item.
                                </p>
                            ) : (
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                    Pilih item yang memiliki kategori untuk
                                    membuat kode aset.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={Package}
                    title="Informasi Produk"
                    description="Identitas dan spesifikasi perangkat atau barang."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                            id="brand"
                            className="mt-1.5 h-10"
                            value={form.data.brand}
                            onChange={(e) =>
                                form.setData('brand', e.target.value)
                            }
                            placeholder="Merk / brand"
                        />
                    </div>
                    <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            className="mt-1.5 h-10"
                            value={form.data.model}
                            onChange={(e) =>
                                form.setData('model', e.target.value)
                            }
                            placeholder="Model / tipe"
                        />
                    </div>
                    <div>
                        <Label htmlFor="serial">Serial Number</Label>
                        <Input
                            id="serial"
                            className="mt-1.5 h-10 font-mono"
                            value={form.data.serial_number}
                            onChange={(e) =>
                                form.setData('serial_number', e.target.value)
                            }
                            placeholder="SN-XXXX"
                        />
                        <FieldError message={form.errors.serial_number} />
                    </div>
                    <div>
                        <Label htmlFor="part-number">Part Number</Label>
                        <Input
                            id="part-number"
                            className="mt-1.5 h-10 font-mono"
                            value={form.data.part_number}
                            onChange={(e) =>
                                form.setData('part_number', e.target.value)
                            }
                            placeholder="PN-XXXX"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={Camera}
                    title="Foto & Dokumen"
                    description="Unggah banyak foto dan dokumen pendukung. Foto dikompres otomatis hingga maksimal 1 MB."
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            Foto Aset
                            <span className="text-[10px] font-normal text-muted-foreground">
                                (bisa banyak)
                            </span>
                        </Label>
                        <MediaUploader
                            type="photo"
                            value={form.data.photo_url}
                            onChange={(urls) => form.setData('photo_url', urls)}
                            onBusyChange={setPhotoBusy}
                        />
                        <FieldError message={form.errors.photo_url} />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            Dokumen Pendukung
                            <span className="text-[10px] font-normal text-muted-foreground">
                                (bisa banyak)
                            </span>
                        </Label>
                        <MediaUploader
                            type="document"
                            value={form.data.document_url}
                            onChange={(urls) =>
                                form.setData('document_url', urls)
                            }
                            onBusyChange={setDocBusy}
                        />
                        <FieldError message={form.errors.document_url} />
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={ShoppingBag}
                    title="Pembelian & Penempatan"
                    description="Detail transaksi serta lokasi pemakaian aset."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="purchase-date">Tanggal Pembelian</Label>
                        <div className="mt-1.5">
                            <DatePicker
                                value={form.data.purchase_date}
                                onChange={(value) =>
                                    form.setData('purchase_date', value)
                                }
                                placeholder="Pilih tanggal pembelian"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="purchase-price">Harga Pembelian</Label>
                        <div className="relative mt-1.5">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                Rp
                            </span>
                            <Input
                                id="purchase-price"
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-10 pl-10"
                                value={form.data.purchase_price}
                                onChange={(e) =>
                                    form.setData(
                                        'purchase_price',
                                        e.target.value,
                                    )
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="vendor">Vendor</Label>
                        <Input
                            id="vendor"
                            className="mt-1.5 h-10"
                            value={form.data.vendor_name}
                            onChange={(e) =>
                                form.setData('vendor_name', e.target.value)
                            }
                            placeholder="Nama vendor / pemasok"
                        />
                    </div>
                    <div>
                        <Label htmlFor="location">Lokasi</Label>
                        <div className="relative mt-1.5">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Select
                                value={form.data.location_id}
                                onValueChange={(value) =>
                                    form.setData('location_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="location"
                                    className="h-10 pl-9"
                                >
                                    <SelectValue placeholder="Pilih Lokasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.length === 0 ? (
                                        <SelectItem value="__none__" disabled>
                                            Tidak ada lokasi tersedia
                                        </SelectItem>
                                    ) : (
                                        locations.map((location) => (
                                            <SelectItem
                                                key={location.id}
                                                value={location.id}
                                            >
                                                {location.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="department">Department</Label>
                        <div className="relative mt-1.5">
                            <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Select
                                value={form.data.department_id}
                                onValueChange={(value) =>
                                    form.setData('department_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="department"
                                    className="h-10 pl-9"
                                >
                                    <SelectValue placeholder="Pilih Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.length === 0 ? (
                                        <SelectItem value="__none__" disabled>
                                            Tidak ada department tersedia
                                        </SelectItem>
                                    ) : (
                                        departments.map((department) => (
                                            <SelectItem
                                                key={department.id_department}
                                                value={department.id_department}
                                            >
                                                {department.nama_department}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={CalendarClock}
                    title="Garansi & Siklus Hidup"
                    description="Tanggal penting untuk pengelolaan dan pemeliharaan."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="in-come-date">Tanggal Masuk</Label>
                        <div className="mt-1.5">
                            <DatePicker
                                value={form.data.in_come_date}
                                onChange={(value) =>
                                    form.setData('in_come_date', value)
                                }
                                placeholder="Pilih tanggal masuk"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="warranty-expire">
                            Masa Garansi (habis)
                        </Label>
                        <div className="mt-1.5">
                            <DatePicker
                                value={form.data.warranty_expire}
                                onChange={(value) =>
                                    form.setData('warranty_expire', value)
                                }
                                placeholder="Pilih tanggal garansi habis"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="garansi-exp">
                            Garansi Vendor (habis)
                        </Label>
                        <div className="mt-1.5">
                            <DatePicker
                                value={form.data.garansi_exp}
                                onChange={(value) =>
                                    form.setData('garansi_exp', value)
                                }
                                placeholder="Pilih tanggal garansi vendor habis"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="broken-date">Tanggal Rusak</Label>
                        <div className="mt-1.5">
                            <DatePicker
                                value={form.data.broken_date}
                                onChange={(value) =>
                                    form.setData('broken_date', value)
                                }
                                placeholder="Pilih tanggal rusak"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={Wallet}
                    title="Status & Kondisi"
                    description="Kelola status siklus hidup aset."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={form.data.status}
                            onValueChange={(value) =>
                                form.setData('status', value)
                            }
                        >
                            <SelectTrigger id="status" className="mt-1.5 h-10">
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
                    <div>
                        <Label htmlFor="condition">Kondisi</Label>
                        <Select
                            value={form.data.condition}
                            onValueChange={(value) =>
                                form.setData('condition', value)
                            }
                        >
                            <SelectTrigger
                                id="condition"
                                className="mt-1.5 h-10"
                            >
                                <SelectValue placeholder="Pilih kondisi" />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITION_OPTIONS.map((option) => (
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
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={FileText}
                    title="Dokumen & Penanggung Jawab"
                    description="Referensi dokumen dan orang yang bertanggung jawab."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="no-spb">No. SPB</Label>
                        <Input
                            id="no-spb"
                            className="mt-1.5 h-10 font-mono"
                            value={form.data.no_spb}
                            onChange={(e) =>
                                form.setData('no_spb', e.target.value)
                            }
                            placeholder="SPB-XXXX"
                        />
                    </div>
                    <div>
                        <Label htmlFor="document-number">Nomor Dokumen</Label>
                        <Input
                            id="document-number"
                            className="mt-1.5 h-10 font-mono"
                            value={form.data.document_number}
                            onChange={(e) =>
                                form.setData('document_number', e.target.value)
                            }
                            placeholder="DOC-XXXX"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <Label htmlFor="pic">PIC</Label>
                        <div className="relative mt-1.5">
                            <MultiSelect
                                options={employees.map((employee) => ({
                                    value: employee.nama_employee,
                                    label: employee.nama_employee,
                                }))}
                                value={form.data.pic}
                                onChange={(values) =>
                                    form.setData('pic', values)
                                }
                                placeholder="Pilih penanggung jawab"
                                searchPlaceholder="Cari karyawan..."
                                emptyText="Karyawan tidak ditemukan."
                                icon={
                                    <UserRound
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                }
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Bisa pilih lebih dari satu.
                        </p>
                        <FieldError message={form.errors.pic} />
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <SectionHeader
                    icon={ClipboardList}
                    title="Catatan Tambahan"
                    description="Informasi lain yang perlu dicatat."
                />

                <div>
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                        id="notes"
                        className="mt-1.5 min-h-24 resize-none"
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Contoh: aset generasi ke-2, unit baru, garansi vendor..."
                    />
                    <FieldError message={form.errors.notes} />
                </div>
            </section>

            <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => history.back()}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    className="h-10 gap-2"
                    disabled={form.processing || mediaBusy}
                >
                    {form.processing && <Spinner className="size-4" />}
                    {mediaBusy && !form.processing
                        ? 'Mengunggah file...'
                        : mode === 'edit'
                          ? 'Simpan Perubahan'
                          : 'Tambah Aset'}
                </Button>
            </div>
        </form>
    );
}
