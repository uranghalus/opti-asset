import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useIsProcessing } from '@/hooks/use-is-processing';
import { cn } from '@/lib/utils';
import { index as reportsIndexRoute } from '@/routes/tenant/reports';
import assetsReportRoute from '@/routes/tenant/reports/assets';
import {
    ArchiveX,
    Box,
    Calendar,
    CreditCard,
    Filter,
    FileDown,
    FileSpreadsheet,
    Gauge,
    History,
    Home,
    Layers,
    List,
    MapPin,
    Package,
    Search,
    ShoppingBag,
    BatteryLow,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AssetReport = {
    id: string;
    kode_asset: string | null;
    item: { code: string; name: string } | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    part_number: string | null;
    status: string;
    condition: string | null;
    location: { name: string } | null;
    department: { nama_department: string } | null;
    vendor_name: string | null;
    purchase_date: string | null;
    purchase_price: string | null;
    asset_type: string | null;
    depreciation_method: string | null;
    accumulated_depreciation: string | null;
    pic: string[] | null;
    no_spb: string | null;
    document_number: string | null;
    notes: string | null;
    photo_url: string[] | null;
    document_url: string[] | null;
};

type AssetItem = {
    id: string;
    code: string;
    name: string;
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

type Summary = {
    total_assets: number;
    total_with_photo: number;
    total_with_document: number;
    total_purchase_value: number;
    total_acquisition_cost: number;
    status_breakdown: Record<string, number>;
    condition_breakdown: Record<string, number>;
    asset_type_breakdown: Record<string, number>;
};

type Filters = {
    per_page?: number;
    item_id?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    part_number?: string;
    has_photo?: boolean;
    has_document?: boolean;
    location_id?: string;
    department_id?: string;
    purchase_date_from?: string;
    purchase_date_to?: string;
    purchase_price_min?: string;
    purchase_price_max?: string;
    vendor_name?: string;
    asset_type?: string;
    depreciation_method?: string;
    acquisition_cost_min?: string;
    acquisition_cost_max?: string;
    useful_life_years?: number;
    has_type_override?: boolean;
    status?: string;
    condition?: string;
    no_spb?: string;
    document_number?: string;
    pic?: string;
    notes?: string;
    warranty_expire_from?: string;
    warranty_expire_to?: string;
    garansi_exp_from?: string;
    garansi_exp_to?: string;
    in_come_date_from?: string;
    in_come_date_to?: string;
    broken_date_from?: string;
    broken_date_to?: string;
};

type PageProps = {
    assets: {
        data: AssetReport[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: Filters;
    summary: Summary;
    items: AssetItem[];
    locations: Location[];
    departments: Department[];
    employees: Employee[];
};

const STATUS_OPTIONS = [
    { value: 'ACT', label: 'Aktif' },
    { value: 'LOAN', label: 'Dipinjamkan' },
    { value: 'RPR', label: 'Perbaikan' },
    { value: 'MUT', label: 'Dimutasi' },
    { value: 'DSP', label: 'Dihapus' },
];

const CONDITION_OPTIONS = [
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
];

const DEPRECIATION_OPTIONS = [
    { value: 'straight_line', label: 'Garisan Lurus (Straight Line)' },
    { value: 'declining_balance', label: 'Saldo Menurun (Declining Balance)' },
    { value: 'none', label: 'Tidak Disusutkan' },
];

export default function AssetsReport() {
    const { assets, filters, summary, items, locations, departments, employees, tenant } = 
        usePage().props as unknown as PageProps & { tenant: string };

    const [localFilters, setLocalFilters] = useState<Filters>(filters);
    const [prevFilters, setPrevFilters] = useState(filters);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessing = useIsProcessing();

    // Sync local state when filters change from server
    useEffect(() => {
        if (filters !== prevFilters) {
            setPrevFilters(filters);
            setLocalFilters(filters);
        }
    }, [filters]);

    // Apply filters and reload
    const applyFilters = (newFilters: Filters = localFilters) => {
        const params: Record<string, string> = {};

        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== false) {
                params[key] = String(value);
            }
        });

        router.get(assetsReportRoute({ tenant }, { query: params }).url, {}, {
            preserveState: true,
            replace: true,
            only: ['assets', 'filters', 'summary'],
        });
    };

    const clearFilters = () => {
        const cleared: Filters = {};
        setLocalFilters(cleared);
        applyFilters(cleared);
    };

    const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Handle search with debounce
    const handleSearchChange = (key: keyof Filters) => (value: string) => {
        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }
        searchTimer.current = setTimeout(() => {
            applyFilters({ ...localFilters, [key]: value });
        }, 300);
    };

    // Export handlers
    const exportXlsx = () => {
        const params: Record<string, string> = {};
        Object.entries(localFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== false) {
                params[key] = String(value);
            }
        });
        router.get(
            assetsReportRoute({ tenant }).url + '?format=xlsx&' + new URLSearchParams(params).toString(),
            {},
            { preserveState: false }
        );
    };

    const exportPdf = () => {
        const params: Record<string, string> = {};
        Object.entries(localFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== false) {
                params[key] = String(value);
            }
        });
        router.get(
            assetsReportRoute({ tenant }).url + '?format=pdf&' + new URLSearchParams(params).toString(),
            {},
            { preserveState: false }
        );
    };

    const hasActiveFilters = Object.values(localFilters).some(v => v !== undefined && v !== null && v !== '' && v !== false);

    const formatCurrency = (value: number | null) => {
        if (!value) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(value);
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID');
    };

    const statusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'ACT': 'Aktif',
            'LOAN': 'Dipinjamkan',
            'RPR': 'Perbaikan',
            'MUT': 'Dimutasi',
            'DSP': 'Dihapus',
        };
        return labels[status] || status;
    };

    const statusColor = (status: string) => {
        const colors: Record<string, string> = {
            'ACT': 'bg-green-100 text-green-800',
            'LOAN': 'bg-blue-100 text-blue-800',
            'RPR': 'bg-yellow-100 text-yellow-800',
            'MUT': 'bg-purple-100 text-purple-800',
            'DSP': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Count active filters
    const activeFilterCount = Object.values(localFilters).filter(v => 
        v !== undefined && v !== null && v !== '' && v !== false
    ).length;

    return (
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Laporan Daftar Aset</h1>
                    <p className="text-muted-foreground">
                        Filter berdasarkan field input aset
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.get(reportsIndexRoute({ tenant }).url)}>
                        <Home className="mr-2 h-4 w-4" />
                        Kembali ke Reports
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={exportXlsx}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Unduh XLSX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportPdf}>
                                <ArchiveX className="mr-2 h-4 w-4" />
                                Unduh PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_assets.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground">dari filter yang ada</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dengan Foto</CardTitle>
                        <Camera className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_with_photo.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dengan Dokumen</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_with_document.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai Pembelian</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_purchase_value)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(summary.status_breakdown).map(([label, count]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-sm">{label}</span>
                                    <Badge variant="outline">{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Kondisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(summary.condition_breakdown).map(([label, count]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-sm">{label}</span>
                                    <Badge variant="outline">{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Tipe Aset</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(summary.asset_type_breakdown).map(([label, count]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-sm">{label}</span>
                                    <Badge variant="outline">{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Panel */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        Filter ({activeFilterCount} aktif)
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="ml-2 h-6 px-2 text-xs"
                            >
                                Reset semua <X className="ml-1 h-3 w-3" />
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Item */}
                        <div>
                            <label className="text-xs font-medium">Item</label>
                            <Select
                                value={localFilters.item_id || ''}
                                onValueChange={v => updateFilter('item_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua item" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Item</SelectItem>
                                    {items.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.code} - {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="text-xs font-medium">Lokasi</label>
                            <Select
                                value={localFilters.location_id || ''}
                                onValueChange={v => updateFilter('location_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua lokasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Lokasi</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="text-xs font-medium">Department</label>
                            <Select
                                value={localFilters.department_id || ''}
                                onValueChange={v => updateFilter('department_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Department</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id_department} value={dept.id_department}>
                                            {dept.nama_department}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-xs font-medium">Status</label>
                            <Select
                                value={localFilters.status || ''}
                                onValueChange={v => updateFilter('status', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Status</SelectItem>
                                    {STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Condition */}
                        <div>
                            <label className="text-xs font-medium">Kondisi</label>
                            <Select
                                value={localFilters.condition || ''}
                                onValueChange={v => updateFilter('condition', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua kondisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Kondisi</SelectItem>
                                    {CONDITION_OPTIONS.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Asset Type */}
                        <div>
                            <label className="text-xs font-medium">Tipe Aset</label>
                            <Select
                                value={localFilters.asset_type || ''}
                                onValueChange={v => updateFilter('asset_type', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Tipe</SelectItem>
                                    <SelectItem value="equipment">Peralatan</SelectItem>
                                    <SelectItem value="fixed_asset">Aktiva Tetap</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Has Photo */}
                        <div>
                            <label className="text-xs font-medium">Foto Aset</label>
                            <Select
                                value={localFilters.has_photo !== false ? (localFilters.has_photo ? 'yes' : '') : 'no'}
                                onValueChange={v => {
                                    if (v === 'all') updateFilter('has_photo', undefined);
                                    else if (v === 'yes') updateFilter('has_photo', true);
                                    else if (v === 'no') updateFilter('has_photo', false);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="yes">Punya Foto</SelectItem>
                                    <SelectItem value="no">Tidak Punya Foto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Has Document */}
                        <div>
                            <label className="text-xs font-medium">Dokumen Pendukung</label>
                            <Select
                                value={localFilters.has_document !== false ? (localFilters.has_document ? 'yes' : '') : 'no'}
                                onValueChange={v => {
                                    if (v === 'all') updateFilter('has_document', undefined);
                                    else if (v === 'yes') updateFilter('has_document', true);
                                    else if (v === 'no') updateFilter('has_document', false);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="yes">Punya Dokumen</SelectItem>
                                    <SelectItem value="no">Tidak Punya Dokumen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Text searches */}
                        <div>
                            <label className="text-xs font-medium">Brand</label>
                            <Input
                                value={localFilters.brand || ''}
                                onChange={e => updateFilter('brand', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium">Model</label>
                            <Input
                                value={localFilters.model || ''}
                                onChange={e => updateFilter('model', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium">No. Serial</label>
                            <Input
                                value={localFilters.serial_number || ''}
                                onChange={e => updateFilter('serial_number', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium">Vendor</label>
                            <Input
                                value={localFilters.vendor_name || ''}
                                onChange={e => updateFilter('vendor_name', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium">No. SPB</label>
                            <Input
                                value={localFilters.no_spb || ''}
                                onChange={e => updateFilter('no_spb', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium">No. Dokumen</label>
                            <Input
                                value={localFilters.document_number || ''}
                                onChange={e => updateFilter('document_number', e.target.value)}
                                placeholder="Pencarian..."
                                className="h-9"
                            />
                        </div>
                    </div>
                    
                    {/* Advanced filters - expandable */}
                    <div className="mt-4">
                        <details open>
                            <summary className="cursor-pointer font-medium text-sm">
                                Filter Lanjutan & Tanggal
                            </summary>
                            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* Purchase Date Range */}
                                <div className="space-y-2">
                                    <label className="text-xs">Tgl Pembelian Dari</label>
                                    <DatePicker
                                        value={localFilters.purchase_date_from || null}
                                        onChange={v => updateFilter('purchase_date_from', v)}
                                        placeholder="Pilih tanggal"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs">Tgl Pembelian Sampai</label>
                                    <DatePicker
                                        value={localFilters.purchase_date_to || null}
                                        onChange={v => updateFilter('purchase_date_to', v)}
                                        placeholder="Pilih tanggal"
                                    />
                                </div>
                                
                                {/* Harga Pembelian */}
                                <div className="space-y-2">
                                    <label className="text-xs">Harga Min</label>
                                    <Input
                                        type="number"
                                        value={localFilters.purchase_price_min || ''}
                                        onChange={e => updateFilter('purchase_price_min', e.target.value)}
                                        placeholder="0"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs">Harga Max</label>
                                    <Input
                                        type="number"
                                        value={localFilters.purchase_price_max || ''}
                                        onChange={e => updateFilter('purchase_price_max', e.target.value)}
                                        placeholder="0"
                                        className="h-9"
                                    />
                                </div>

                                {/* Other advanced filters */}
                                <div className="space-y-2">
                                    <label className="text-xs">Kode Aset / Serial (Contains)</label>
                                    <Input
                                        value={localFilters.kode_asset || ''}
                                        onChange={e => updateFilter('kode_asset', e.target.value)}
                                        placeholder="Pencarian..."
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </details>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => applyFilters()}>
                            Terapkan Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Aset</CardTitle>
                    <CardDescription>
                        {assets.total} data ditemukan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isProcessing ? (
                        <Skeleton className="h-96 w-full" />
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode Aset</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Brand/Model</TableHead>
                                        <TableHead>Serial</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Kondisi</TableHead>
                                        <TableHead>Lokasi</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Ada Foto</TableHead>
                                        <TableHead>Ada Dokumen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-8">
                                                Tidak ada data yang cocok
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        assets.data.map((asset) => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-mono">
                                                    {asset.kode_asset || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {asset.item?.code || '-'} / {asset.item?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {asset.brand || '-'} / {asset.model || '-'}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {asset.serial_number || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColor(asset.status)}>
                                                        {statusLabel(asset.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{asset.condition || '-'}</TableCell>
                                                <TableCell>{asset.location?.name || '-'}</TableCell>
                                                <TableCell>{asset.department?.nama_department || '-'}</TableCell>
                                                <TableCell>{asset.vendor_name || '-'}</TableCell>
                                                <TableCell>
                                                    {asset.photo_url && asset.photo_url.length > 0 ? 'Ya' : 'Tidak'}
                                                </TableCell>
                                                <TableCell>
                                                    {asset.document_url && asset.document_url.length > 0 ? 'Ya' : 'Tidak'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {assets.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-end gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Halaman {assets.current_page} dari {assets.last_page}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => assets.current_page > 1 && router.get(
                                            assetsReportRoute({ tenant }, { query: { ...localFilters, page: assets.current_page - 1 } }).url,
                                            {},
                                            { preserveState: false }
                                        )}
                                        disabled={assets.current_page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => assets.current_page < assets.last_page && router.get(
                                            assetsReportRoute({ tenant }, { query: { ...localFilters, page: assets.current_page + 1 } }).url,
                                            {},
                                            { preserveState: false }
                                        )}
                                        disabled={assets.current_page === assets.last_page}
                                    >
                                        Berikutnya
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
