import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArchiveX,
    Calendar,
    Check,
    Package,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    approve as approveRoute,
    destroy,
    edit as editRoute,
    index as indexRoute,
    reject as rejectRoute,
} from '@/routes/disposals';

type Disposal = {
    id: number;
    asset: {
        id: string;
        kode_asset: string | null;
        nama_asset: string | null;
        serial_number: string | null;
    } | null;
    disposedBy: { id: number; name: string } | null;
    reason: string | null;
    disposal_date: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
};

type PageProps = {
    disposal: Disposal;
};

const STATUS_STYLES: Record<string, string> = {
    pending:
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    approved:
        'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    rejected:
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function DisposalShow() {
    const { disposal } = usePage().props as unknown as PageProps;
    const [deleting, setDeleting] = useState<Disposal | null>(null);
    const [deletingState, setDeletingState] = useState(false);
    const updateStatus = (action: 'approve' | 'reject') => {
        router.post(
            (action === 'approve' ? approveRoute : rejectRoute)(disposal.id)
                .url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        action === 'approve'
                            ? 'Pengajuan disetujui.'
                            : 'Pengajuan ditolak.',
                    ),
                onError: () =>
                    toast.error('Status pengajuan gagal diperbarui.'),
            },
        );
    };

    const handleDelete = () => {
        if (!deleting) {
            return;
        }

        setDeletingState(true);
        router.delete(destroy(deleting.id).url, {
            only: ['disposal'],
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDeletingState(false);
                setDeleting(null);
                toast.success('Penghapusan aset berhasil dihapus.');
                router.visit(indexRoute().url);
            },
            onError: () => {
                setDeletingState(false);
                toast.error('Gagal menghapus penghapusan aset.');
            },
        });
    };

    return (
        <>
            <Head title="Detail Penghapusan Aset" />

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(0,128,255,0.14),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.1),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(90,169,236,0.16),transparent_60%),radial-gradient(50%_45%_at_100%_100%,rgba(139,92,246,0.12),transparent_60%)]"
                />
                <div className="mx-auto w-full max-w-3xl">
                    <div className="card-enter flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={indexRoute().url}
                                className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                                Kembali
                            </Link>
                            <div className="glass-card flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <ArchiveX
                                    className="size-6"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Detail Penghapusan
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    #{disposal.id} &middot;{' '}
                                    {disposal.asset?.kode_asset}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {disposal.status === 'pending' && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="h-10 gap-2 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                                        onClick={() => updateStatus('approve')}
                                    >
                                        <Check className="size-4" />
                                        Setujui
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-10 gap-2 rounded-xl border-rose-500/30 text-rose-700 hover:bg-rose-500/10"
                                        onClick={() => updateStatus('reject')}
                                    >
                                        <X className="size-4" />
                                        Tolak
                                    </Button>
                                    <Link href={editRoute(disposal.id).url}>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-card/70 shadow-sm backdrop-blur-xl"
                                        onClick={() => setDeleting(disposal)}
                                        aria-label="Hapus"
                                    >
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel card-enter mt-5 rounded-2xl p-5 delay-100 md:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="glass-card flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                    <Package
                                        className="size-7"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {disposal.asset?.nama_asset ?? 'Aset'}
                                    </h2>
                                    <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                                        {disposal.asset?.kode_asset ?? '—'}
                                    </p>
                                    {disposal.asset?.serial_number && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Serial:{' '}
                                            {disposal.asset.serial_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ring-1',
                                    STATUS_STYLES[disposal.status] ??
                                        'bg-slate-500/10 text-slate-600 ring-slate-500/20',
                                )}
                            >
                                {STATUS_LABELS[disposal.status] ??
                                    disposal.status}
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-card/50 p-4 backdrop-blur-xl">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Alasan
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-foreground">
                                    {disposal.reason ?? 'Tidak ada alasan.'}
                                </p>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-card/50 p-4 backdrop-blur-xl">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Tanggal Penghapusan
                                </p>
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    {formatDate(disposal.disposal_date)}
                                </div>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-card/50 p-4 backdrop-blur-xl">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Diajukan Oleh
                                </p>
                                <p className="text-sm text-foreground">
                                    {disposal.disposedBy?.name ?? '—'}
                                </p>
                            </div>

                            <div className="space-y-1.5 rounded-xl border border-border/70 bg-card/50 p-4 backdrop-blur-xl">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Tanggal Pengajuan
                                </p>
                                <p className="text-sm text-foreground">
                                    {formatDate(disposal.created_at)}
                                </p>
                            </div>
                        </div>

                        {disposal.status === 'pending' && (
                            <div className="mt-6 flex gap-3">
                                <Link href={editRoute(disposal.id).url}>
                                    <Button className="flex-1 gap-2 rounded-xl">
                                        <Pencil className="size-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="destructive"
                                    className="flex-1 gap-2 rounded-xl"
                                    onClick={() => setDeleting(disposal)}
                                >
                                    <Trash2 className="size-4" />
                                    Hapus
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Penghapusan Aset</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengajuan
                            penghapusan aset ini? Tindakan tidak dapat
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleting(null)}
                            disabled={deletingState}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deletingState}
                            className="gap-2"
                        >
                            {deletingState && <Spinner className="size-4" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

DisposalShow.layout = (props: { disposal: Disposal }) => ({
    breadcrumbs: [
        {
            title: 'Daftar Penghapusan',
            href: indexRoute().url,
        },
        {
            title: `Detail #${props.disposal.id}`,
        },
    ],
});
