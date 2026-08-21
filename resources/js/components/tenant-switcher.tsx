import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import tenant from '@/routes/tenant';

type PageProps = {
    tenant?: { id: string; name: string } | null;
    availableTenants: { id: string; name: string }[];
    auth: {
        user: {
            roles: string[];
        };
    };
};

export function TenantSwitcher() {
    const page = usePage().props as unknown as PageProps;
    const currentTenant = page.tenant;
    const availableTenants = page.availableTenants;
    const isSuperAdmin = page.auth.user.roles.includes('super-admin');
    const [open, setOpen] = useState(false);

    const handleSwitch = (tenantId: string) => {
        setOpen(false);
        router.post(tenant.switch().url, { tenant_id: tenantId });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!isSuperAdmin}
                    className="h-9 w-full justify-start gap-2.5 rounded-lg border-sidebar-border bg-sidebar-accent/40 px-2 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[state=open]:border-sidebar-ring/30 data-[state=open]:bg-sidebar-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Building2 className="size-3.5 shrink-0 text-sidebar-foreground/50" />
                    <span className="truncate">
                        {currentTenant?.name ?? 'Pilih Tenant'}
                    </span>
                    <ChevronsUpDown className="ml-auto size-3 shrink-0 text-sidebar-foreground/40" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) min-w-48 p-0"
                align="start"
                side="top"
            >
                <Command>
                    <CommandInput placeholder="Cari tenant..." />
<CommandList>
                    <CommandEmpty>Tidak ada tenant.</CommandEmpty>
                    <CommandGroup heading="Ganti Tenant">
                        {isSuperAdmin
                            ? availableTenants.map((t) => (
                                <CommandItem
                                    key={t.id}
                                    value={t.id}
                                    onSelect={() => handleSwitch(t.id)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 size-4',
                                            currentTenant?.id === t.id
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {t.name}
                                </CommandItem>
                            ))
                            : currentTenant
                                ? (
                                    <CommandItem
                                        key={currentTenant.id}
                                        value={currentTenant.id}
                                        disabled
                                    >
                                        <Check className="mr-2 size-4 opacity-100" />
                                        {currentTenant.name}
                                    </CommandItem>
                                )
                                : null}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
