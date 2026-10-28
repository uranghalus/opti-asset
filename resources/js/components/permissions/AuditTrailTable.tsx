import { router } from '@inertiajs/react';
import { ArrowRight, Clock, UserCircle, ShieldCheck, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy as destroyGrant } from '@/routes/super-admin-grants';

type GrantAudit = {
    id: number;
    actor_name: string;
    actor_email: string;
    target_name: string;
    target_email: string;
    action: 'granted' | 'revoked';
    created_at: string;
    ip_address?: string | null;
};

type AuditTrailTableProps = {
    grants: GrantAudit[];
    loading?: boolean;
    onRefresh?: () => void;
};

const ACTION_LABELS: Record<string, string> = {
    granted: 'Diberikan',
    revoked: 'Dicabut',
};

const ACTION_VARIANTS: Record<string, string> = {
    granted: 'default',
    revoked: 'destructive',
};

export function AuditTrailTable({
    grants,
    loading = false,
    onRefresh,
}: AuditTrailTableProps) {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);

        if (onRefresh) {
            onRefresh();
        }

        setTimeout(() => setRefreshing(false), 500);
    };

    const handleRevoke = (grant: GrantAudit) => {
        if (
            !confirm(
                `Apakah Anda yakin ingin mencabut hak super-admin dari ${grant.target_name}?`,
            )
        ) {
            return;
        }

        router.delete(destroyGrant({ query: { id: grant.id } }).url, {
            onSuccess: () => {
                toast.success(
                    `Hak super-admin dari ${grant.target_name} berhasil dicabut.`,
                );
                window.dispatchEvent(
                    new CustomEvent('super-admin-grant:changed'),
                );
            },
            onError: () => {
                toast.error('Gagal mencabut hak super-admin. Coba lagi nanti.');
            },
        });
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-1/3" />
                <div className="grid gap-3 pt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (grants.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="mb-3 size-12 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                    Belum ada jejak audit
                </h3>
                <p className="text-sm text-muted-foreground">
                    Riwayat pemberian dan pencabutan hak super-admin akan muncul
                    di sini.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    Jejak Audit Hak SuperAdmin
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-9"
                >
                    {refreshing ? (
                        <ArrowRight className="mr-1 size-3 animate-spin" />
                    ) : (
                        <Clock className="mr-1 size-3" />
                    )}
                    Segarkan
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20">Target</TableHead>
                        <TableHead className="w-20">Oleh</TableHead>
                        <TableHead className="w-16">Aksi</TableHead>
                        <TableHead className="w-24">Waktu</TableHead>
                        <TableHead className="w-20">IP Address</TableHead>
                        <TableHead className="w-20 text-right">
                            Tindakan
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {grants.map((grant) => (
                        <TableRow key={grant.id}>
                            <TableCell className="pr-4">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="size-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {grant.target_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {grant.target_email}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="pr-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {grant.actor_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {grant.actor_email}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        ACTION_VARIANTS[grant.action] as
                                            'default' | 'destructive'
                                    }
                                    className="text-xs"
                                >
                                    {ACTION_LABELS[grant.action]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(grant.created_at).toLocaleString(
                                    'id-ID',
                                    {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    },
                                )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {grant.ip_address ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                                {grant.action === 'granted' ? (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRevoke(grant)}
                                        className="h-8 px-2 text-xs"
                                    >
                                        Cabut
                                    </Button>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        —
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
