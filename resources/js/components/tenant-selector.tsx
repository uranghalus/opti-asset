import { router, usePage } from '@inertiajs/react';
import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { signed as tenantSwitchSigned } from '@/routes/tenant/switch';

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
    const [open, setOpen] = useState(false);

    const handleSwitch = (tenantCode: string) => {
        if (currentTenant?.code === tenantCode) {
            setOpen(false);
            return;
        }
        router.get(
            tenantSwitchSigned.url({ tenantCode }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setOpen(false),
            },
        );
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    aria-label={
                        currentTenant
                            ? `Ganti tenant — aktif: ${currentTenant.name}`
                            : 'Pilih tenant'
                    }
                    className="group h-11 min-w-0 max-w-[140px] px-3 shadow-none sm:max-w-[320px] sm:min-w-[200px] data-[state=open]:bg-accent"
                >
                    <Building2
                        className={cn(
                            'size-4 shrink-0',
                            currentTenant
                                ? 'text-primary'
                                : 'text-muted-foreground',
                        )}
                        aria-hidden="true"
                    />
                    <span className="min-w-0 truncate">
                        {currentTenant ? currentTenant.name : 'Pilih Tenant'}
                    </span>
                    <ChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                sideOffset={6}
                className="w-72 p-0 shadow-overlay"
            >
                <DropdownMenuLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tenant Tersedia
                </DropdownMenuLabel>

                {availableTenants.map((tenant) => {
                    const active = currentTenant?.code === tenant.code;

                    return (
                        <DropdownMenuItem
                            key={tenant.id}
                            className={cn(
                                'flex min-h-[44px] cursor-pointer items-center gap-2 px-4 py-2 text-sm',
                                active &&
                                    'bg-primary-muted text-primary focus:bg-primary-muted focus:text-primary',
                            )}
                            onClick={() => handleSwitch(tenant.code)}
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {tenant.name}
                            </span>
                            {active && (
                                <span className="flex shrink-0 items-center gap-1 text-xs">
                                    <span
                                        className="size-2 rounded-full bg-primary"
                                        aria-hidden="true"
                                    />
                                    Aktif
                                </span>
                            )}
                        </DropdownMenuItem>
                    );
                })}

                {availableTenants.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Tidak ada tenant tersedia
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
