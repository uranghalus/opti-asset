'use client';

import { router, usePage } from '@inertiajs/react';
import { ChevronDown, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Tenant = {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
};

type PageProps = {
    tenant?: Tenant | null;
    availableTenants: Tenant[];
    auth: {
        user?: {
            roles?: string[];
        };
    };
};

export function TenantSelector() {
    const page = usePage().props as unknown as PageProps;
    const currentTenant = page.tenant;
    const availableTenants = page.availableTenants ?? [];
    const roles = page.auth.user?.roles ?? [];
    const isSuperAdmin = roles.some((r) => {
        const n = r.toLowerCase().replace(/_/g, '-');
        return n === 'super-admin' || n === 'superadmin';
    });
    const [open, setOpen] = useState(false);

    const handleSwitch = (tenantCode: string) => {
        if (currentTenant?.code === tenantCode) {
            setOpen(false);
            return;
        }
        router.get(`/tenant/switch/${tenantCode}`, {
            preserveScroll: true,
            onFinish: () => setOpen(false),
        });
    };

    const tenantLabel = currentTenant ? (
        <>
            <Building2 className="mr-2 size-4" />
            {currentTenant.name}
        </>
    ) : (
        'Pilih Tenant'
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    {tenantLabel}
                    <ChevronDown className="ml-auto size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-0">
                <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">
                    Pilih Tenant
                </DropdownMenuLabel>
                {availableTenants.map((tenant) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-sm',
                            currentTenant?.code === tenant.code
                                ? 'bg-primary text-primary-foreground'
                                : '',
                        )}
                        onClick={() => handleSwitch(tenant.code)}
                    >
                        {tenant.name}
                        {currentTenant?.code === tenant.code && (
                            <span className="ml-auto text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-green-500" />
                                    Aktif
                                </span>
                            </span>
                        )}
                    </DropdownMenuItem>
                ))}
                {availableTenants.length > 1 && currentTenant && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-sm text-destructive"
                            onClick={() => {
                                // Sign out / clear tenant
                                router.get('/tenant/switch/' + currentTenant.code, {
                                    preserveScroll: true,
                                    onFinish: () => setOpen(false),
                                });
                            }}
                        >
                            Keluar dari tenant
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
