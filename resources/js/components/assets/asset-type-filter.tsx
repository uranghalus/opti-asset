import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function AssetTypeFilter({
    value,
    onChange,
    status,
    onStatusChange,
}: {
    value: '' | 'fixed_asset' | 'equipment';
    onChange: (value: '' | 'fixed_asset' | 'equipment') => void;
    status: string;
    onStatusChange: (status: string) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipe Aset</Label>
                <Select
                    value={value}
                    onValueChange={(v) =>
                        onChange(v as '' | 'fixed_asset' | 'equipment')
                    }
                >
                    <SelectTrigger className="h-9 w-[140px] bg-white/10 border-white/15">
                        <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tipe</SelectItem>
                        <SelectItem value="fixed_asset">Aktiva Tetap</SelectItem>
                        <SelectItem value="equipment">Peralatan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-9 w-[130px] bg-white/10 border-white/15">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Semua Status</SelectItem>
                        <SelectItem value="ACT">Aktif</SelectItem>
                        <SelectItem value="LOAN">Dipinjamkan</SelectItem>
                        <SelectItem value="RPR">Perbaikan</SelectItem>
                        <SelectItem value="MUT">Dimutasi</SelectItem>
                        <SelectItem value="DSP">Dihapus</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}