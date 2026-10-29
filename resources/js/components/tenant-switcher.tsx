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
        setOpen(false);
        router.post(tenant.switch().url, { tenant_id: tenantId });
    };

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
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-[13px] bg-brand-subtle text-primary ring-1 ring-brand/20 transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
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
                        className="ml-auto size-3.5 shrink-0 text-text-tertiary transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transform-none motion-reduce:transition-none"
                        aria-hidden="true"
                    />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-(--radix-popover-trigger-width) min-w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
                align="start"
                side="bottom"
                sideOffset={8}
            >
                <Command className="bg-transparent">
                    <div className="px-1 pt-1 pb-1.5">
                        <CommandInput
                            placeholder="Cari tenant..."
                            className="h-9 rounded-xl border-none bg-slate-100/70 text-xs shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:ring-0 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                    </div>
                    <CommandList className="max-h-56 p-1">
                        <CommandEmpty className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                            Tidak ada tenant.
                        </CommandEmpty>
                        <CommandGroup
                            heading={
                                <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    Ganti Tenant
                                </span>
                            }
                        >
                            {isSuperAdmin ? (
                                availableTenants.map((t) => {
                                    const isSelected =
                                        currentTenant?.id === t.id;

                                    return (
                                        <CommandItem
                                            key={t.id}
                                            value={t.name}
                                            onSelect={() => handleSwitch(t.id)}
                                            className={cn(
                                                'my-0.5 flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
                                                isSelected
                                                    ? 'bg-gradient-to-r from-[#2D82B7] to-[#2571A1] text-white shadow-[0_4px_12px_rgba(45,130,183,0.35)]'
                                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80',
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <div
                                                    className={cn(
                                                        'flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors',
                                                        isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400',
                                                    )}
                                                >
                                                    <Building2 className="size-3" />
                                                </div>
                                                <span className="truncate">
                                                    {t.name}
                                                </span>
                                            </div>

                                            {isSelected && (
                                                <Check className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                                            )}
                                        </CommandItem>
                                    );
                                })
                            ) : currentTenant ? (
                                <CommandItem
                                    key={currentTenant.id}
                                    value={currentTenant.name}
                                    disabled
                                    className="my-0.5 flex items-center justify-between rounded-xl bg-[#2D82B7]/10 px-2.5 py-2 text-xs font-bold text-[#2D82B7] opacity-80 dark:bg-[#2D82B7]/20 dark:text-sky-300"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#2D82B7]/20">
                                            <Building2 className="size-3 text-[#2D82B7] dark:text-sky-300" />
                                        </div>
                                        <span className="truncate">
                                            {currentTenant.name}
                                        </span>
                                    </div>
                                    <Check className="size-4 text-[#2D82B7] dark:text-sky-300" />
                                </CommandItem>
                            ) : null}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
