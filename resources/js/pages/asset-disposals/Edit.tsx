import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArchiveX, Calendar, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsProcessing } from '@/hooks/use-is-processing';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { index as indexRoute, update as updateRoute } from '@/routes/disposals';

type AssetOption = {
    id: string;
    kode_asset: string | null;
    nama_asset: string | null;
    item: { id: string; name: string; code: string } | null;
};

type Disposal = {
    id: number;
    asset: { id: string; kode_asset: string | null; nama_asset: string | null } | null;
    reason: string | null;
    disposal_date: string | null;
    status: 'pending' | 'approved' | 'rejected';
};

type PageProps = {
    disposal: Disposal;
    assets: AssetOption[];
};

export default function AssetDisposalsEdit() {
    const { disposal, assets } = usePage().props as unknown as PageProps;
    const { data, setData, patch, errors, processing } = useForm({
        asset_id: disposal.asset?.id ?? '',
        reason: disposal.reason ?? '',
        disposal_date: disposal.disposal_date ?? '',
    });
    const isProcessing = useIsProcessing();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(updateRoute(disposal.id).url, {
            onSuccess: () => {
                toast.success('Pengajuan penghapusan aset berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui pengajuan penghapusan aset.');
            },
        });
    };

    return (
        <>
            <Head title="Edit Penghapusan Aset" />

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]"
                />
                <div className="mx-auto w-full max-w-2xl">
                    <Link
                        href={indexRoute().url}
                        className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Kembali ke Daftar Penghapusan
                    </Link>

                    <div className="glass-panel card-enter mt-5 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="glass-card flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <ArchiveX className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Edit Penghapusan Aset
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Perbarui data pengajuan penghapusan aset.
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                            <ArchiveX className="size-3.5" strokeWidth={2} />
                            #{disposal.id}
                        </span>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="glass-panel card-enter mt-4 rounded-2xl p-5 delay-100 md:p-7"
                    >
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="asset_id"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Aset
                                </Label>
                                <Select
                                    value={data.asset_id || undefined}
                                    onValueChange={(value) =>
                                        setData('asset_id', value)
                                    }
                                    disabled={isProcessing}
                                >
                                    <SelectTrigger
                                        id="asset_id"
                                        className={cn(
                                            'h-10 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl',
                                            errors.asset_id &&
                                                'border-destructive',
                                        )}
                                    >
                                        <SelectValue placeholder="Pilih aset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map((asset) => (
                                            <SelectItem
                                                key={asset.id}
                                                value={asset.id}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {asset.nama_asset ??
                                                            'Aset'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {asset.kode_asset ??
                                                            asset.item?.code ??
                                                            '—'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.asset_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.asset_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="reason"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Alasan Penghapusan
                                </Label>
                                <div className="relative">
                                    <FileText className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                    <Textarea
                                        id="reason"
                                        value={data.reason}
                                        onChange={(e) =>
                                            setData('reason', e.target.value)
                                        }
                                        placeholder="Masukkan alasan penghapusan aset..."
                                        rows={4}
                                        className={cn(
                                            'resize-y rounded-xl border-border/70 bg-card/70 pl-10 text-sm shadow-sm backdrop-blur-xl',
                                            errors.reason &&
                                                'border-destructive',
                                        )}
                                    />
                                </div>
                                {errors.reason && (
                                    <p className="text-xs text-destructive">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="disposal_date"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Tanggal Penghapusan
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="disposal_date"
                                        type="date"
                                        value={data.disposal_date}
                                        onChange={(e) =>
                                            setData(
                                                'disposal_date',
                                                e.target.value,
                                            )
                                        }
                                        className={cn(
                                            'h-10 rounded-xl border-border/70 bg-card/70 pl-10 text-sm shadow-sm backdrop-blur-xl',
                                            errors.disposal_date &&
                                                'border-destructive',
                                        )}
                                    />
                                </div>
                                {errors.disposal_date && (
                                    <p className="text-xs text-destructive">
                                        {errors.disposal_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-7 flex items-center justify-end gap-3 border-t border-border/60 pt-5">
                            <Link href={indexRoute().url}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="rounded-xl"
                                >
                                    Batal
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isProcessing || processing}
                                className="gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                            >
                                {(isProcessing || processing) && (
                                    <div className="ease-premium flex size-4 items-center justify-center">
                                        <Package className="animate-spin" />
                                    </div>
                                )}
                                Perbarui
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

AssetDisposalsEdit.layout = (props: { disposal: Disposal }) => ({
    breadcrumbs: [
        {
            title: 'Daftar Penghapusan',
            href: indexRoute().url,
        },
        {
            title: `Edit #${props.disposal.id}`,
        },
    ],
});