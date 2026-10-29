import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronDown } from 'lucide-react';
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
    canSwitchTenant: boolean;
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
    const canSwitchTenant = page.canSwitchTenant ?? false;
    const roles = page.auth.user.roles ?? [];
    const isSuperAdmin = roles.some((r) => {
        const n = r.toLowerCase().replace(/_/g, '-');

        return n === 'super-admin' || n === 'superadmin';
    });
    const [open, setOpen] = useState(false);

    const handleSwitch = (tenantId: string) => {
        if (currentTenant?.id === tenantId) {
            return;
        }

        setOpen(false);
        router.post(tenant.switch().url, { tenant_id: tenantId });
    };

    const sortedTenants = [...availableTenants].sort((a, b) =>
        a.name.localeCompare(b.name, 'id'),
    );

    /* ------------------------------------------------------------------ */
    /* Static label — no Popover, no chevron, no click                    */
    /* Shown when switching is disabled or only one tenant is available   */
    /* ------------------------------------------------------------------ */
    if (!canSwitchTenant || availableTenants.length <= 1) {
        return (
            <div
                aria-label={
                    currentTenant
                        ? `Tenant ${currentTenant.name}`
                        : 'Tenant belum dipilih'
                }
                className={cn(
                    'inline-flex items-center gap-2 rounded-[18px] border border-brand/40 bg-surface-sunken px-3 py-2',
                    'dark:border-brand/40 dark:bg-surface-sunken',
                )}
            >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-[13px] bg-brand-subtle text-primary">
                    <Building2 className="size-3" aria-hidden="true" />
                </div>

                <div className="flex flex-col truncate text-left leading-tight">
                    <span className="truncate text-[11px] font-bold tracking-wider text-text-secondary uppercase">
                        Tenant
                    </span>
                    <span className="truncate font-heading text-sm font-extrabold text-text-primary">
                        {currentTenant?.name ?? 'Pilih Tenant'}
                    </span>
                </div>

                {currentTenant && (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Aktif
                    </span>
                )}
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /* Switchable trigger chip — opens the Popover tenant list            */
    /* ------------------------------------------------------------------ */
    const ariaLabel = `Pilih tenant${currentTenant ? ' ' + currentTenant.name : ''}`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-haspopup="listbox"
                    aria-label={ariaLabel}
                    className={cn(
                        'group relative min-h-11 w-full justify-start gap-3 rounded-[18px] px-3 py-2',
                        'border border-brand/40 bg-surface-sunken text-text-primary',
                        'hover:border-brand/60 hover:bg-brand-subtle',
                        'focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1 focus-visible:outline-none',
                        'data-[state=open]:border-brand/40 data-[state=open]:bg-brand-subtle data-[state=open]:shadow-glow-primary',
                        'dark:border-brand/40 dark:bg-surface-sunken dark:text-text-primary',
                        'dark:hover:border-brand/60 dark:hover:bg-brand-subtle',
                        'motion-reduce:transition-none',
                    )}
                >
                    {/* Icon container — decorative icon, aria-hidden */}
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-[13px] bg-brand-subtle text-primary ring-1 ring-brand/20">
                        <Building2 className="size-3.5" aria-hidden="true" />
                    </div>

                    <div className="flex flex-col truncate text-left leading-tight">
                        <span className="truncate text-[11px] font-bold tracking-wider text-text-secondary uppercase">
                            Tenant
                        </span>
                        <span className="truncate font-heading text-sm font-extrabold text-text-primary">
                            {currentTenant?.name ?? 'Pilih Tenant'}
                        </span>
                    </div>

                    <ChevronDown
                        className="ml-auto size-3.5 shrink-0 text-text-tertiary"
                        aria-hidden="true"
                    />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                aria-label="Pilih tenant"
                className={cn(
                    'w-(--radix-popover-trigger-width) min-w-56 overflow-hidden rounded-2xl p-1.5',
                    'border border-border-subtle bg-card shadow-glow-primary',
                    'dark:border-border-subtle dark:bg-card dark:shadow-glow-primary',
                )}
                align="start"
                side="bottom"
                sideOffset={8}
            >
                <Command label="Ganti tenant" className="bg-transparent">
                    <div className="px-1 pt-1 pb-1.5">
                        <CommandInput
                            placeholder="Cari tenant..."
                            className="h-9 rounded-xl border-none bg-surface-sunken text-xs text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] placeholder:text-text-tertiary focus:ring-0 dark:text-text-primary dark:placeholder:text-text-tertiary"
                        />
                    </div>
                    <CommandList label="Daftar tenant" className="max-h-56 p-1">
                        <CommandEmpty className="py-4 text-center text-xs text-text-secondary dark:text-text-tertiary">
                            Tidak ada tenant.
                        </CommandEmpty>
                        <CommandGroup
                            heading={
                                <span className="px-2 text-[10px] font-bold tracking-wider text-text-secondary uppercase dark:text-text-tertiary">
                                    Ganti Tenant
                                </span>
                            }
                        >
                            {isSuperAdmin ? (
                                sortedTenants.map((t) => {
                                    const isSelected =
                                        currentTenant?.id === t.id;

                                    return (
                                        <CommandItem
                                            key={t.id}
                                            value={t.id}
                                            keywords={[t.name]}
                                            aria-current={
                                                isSelected ? 'true' : undefined
                                            }
                                            onSelect={() => handleSwitch(t.id)}
                                            className={cn(
                                                'my-0.5 flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold',
                                                'transition-[color,background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none',
                                                'data-[selected=true]:bg-surface-hover data-[selected=true]:text-text-primary',
                                                isSelected
                                                    ? 'bg-brand-subtle text-text-primary'
                                                    : 'text-text-secondary hover:bg-surface-hover dark:text-text-secondary dark:hover:bg-surface-hover',
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <div
                                                    className={cn(
                                                        'flex size-6 shrink-0 items-center justify-center rounded-lg transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none',
                                                        isSelected
                                                            ? 'bg-brand-subtle text-primary'
                                                            : 'bg-surface-sunken text-text-secondary dark:bg-surface-sunken dark:text-text-secondary',
                                                    )}
                                                >
                                                    <Building2
                                                        className="size-3"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <span className="truncate">
                                                    {t.name}
                                                </span>

                                                {isSelected && (
                                                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <Check
                                                    className="size-4 text-primary"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </CommandItem>
                                    );
                                })
                            ) : currentTenant ? (
                                <CommandItem
                                    key={currentTenant.id}
                                    value={currentTenant.id}
                                    disabled
                                    className={cn(
                                        'my-0.5 flex min-h-11 items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold',
                                        'bg-brand-subtle text-primary opacity-80',
                                        'dark:bg-brand-subtle dark:text-primary',
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand-subtle">
                                            <Building2
                                                className="size-3 text-primary"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <span className="truncate">
                                            {currentTenant.name}
                                        </span>
                                    </div>
                                    <Check
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                </CommandItem>
                            ) : null}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
