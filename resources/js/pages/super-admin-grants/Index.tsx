import { router, usePage } from '@inertiajs/react';
import { ShieldCheck, Activity, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { AuditTrailTable } from '@/components/permissions/AuditTrailTable';
import { SuperAdminGrantForm } from '@/components/permissions/SuperAdminGrantForm';
import { Badge } from '@/components/ui/badge';

type SharedAuth = {
    user?: {
        id: number;
        name: string;
        email: string;
        roles?: string[];
        permissions?: string[];
    } | null;
    isSuperAdmin?: boolean;
};

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

type UserOption = {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
};

type PageProps = {
    auth: SharedAuth;
    grants: GrantAudit[];
    users: UserOption[];
};

export default function SuperAdminGrantsPage() {
    const { auth, grants, users } = usePage().props as unknown as PageProps;

    const isSuperAdmin = auth?.isSuperAdmin === true;
    const canView =
        isSuperAdmin ||
        (auth?.user?.permissions ?? []).includes('super-admin.view');

    useEffect(() => {
        const handleGrantChanged = () => {
            router.reload();
        };

        window.addEventListener(
            'super-admin-grant:changed',
            handleGrantChanged,
        );

        return () => {
            window.removeEventListener(
                'super-admin-grant:changed',
                handleGrantChanged,
            );
        };
    }, []);

    if (!canView) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <ShieldCheck className="mb-4 size-16 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                    Akses Ditolak
                </h2>
                <p className="text-muted-foreground">
                    Anda tidak memiliki izin untuk melihat halaman Hak Akses
                    SuperAdmin.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Hak Akses SuperAdmin
                    </h1>
                    <p className="text-muted-foreground">
                        Kelola pemberian dan pencabutan hak super-admin bagi
                        pengguna.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge
                        variant={isSuperAdmin ? 'default' : 'secondary'}
                        className="px-3 py-1.5 text-xs"
                    >
                        {isSuperAdmin ? 'Super Admin' : 'Petugas'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <UserPlus className="size-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                Berikan Hak
                            </h2>
                        </div>
                        <SuperAdminGrantForm users={users} loading={false} />
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="size-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Jejak Audit
                                </h2>
                            </div>
                            <span className="rounded bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
                                {grants.length} entri
                            </span>
                        </div>
                        <AuditTrailTable grants={grants} loading={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
