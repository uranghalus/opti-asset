import { Link, router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface TenantPageProps {
    currentTenant: {
        id: number;
        name: string;
        domain: string;
    } | null;
    tenants: Array<{
        id: number;
        name: string;
        domain: string;
        role: string;
    }>;
}

export function TenantSwitcher() {
    const { currentTenant, tenants } = usePage().props as TenantPageProps;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!tenants || tenants.length === 0) {
        return null;
    }

    const handleSwitch = (tenantId: number) => {
        if (tenantId === currentTenant?.id) {
            return;
        }

        router.post(
            `/tenants/${tenantId}/switch`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                            data-test="tenant-switcher-button"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#006FCF] text-white">
                                <span className="text-xs font-semibold">
                                    {currentTenant?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'T'}
                                </span>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {currentTenant?.name ||
                                        'Select Organization'}
                                </span>
                                {currentTenant?.domain && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {currentTenant.domain}
                                    </span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Organizations
                        </DropdownMenuLabel>
                        {tenants.map((tenant) => (
                            <DropdownMenuItem
                                key={tenant.id}
                                onClick={() => handleSwitch(tenant.id)}
                                className="cursor-pointer gap-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded bg-[#006FCF] text-white">
                                    <span className="text-[10px] font-semibold">
                                        {tenant.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex flex-1 flex-col">
                                    <span className="font-medium">
                                        {tenant.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {tenant.role}
                                    </span>
                                </div>
                                {currentTenant?.id === tenant.id && (
                                    <Check className="size-4 text-[#006FCF]" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/tenants" className="gap-2">
                                <Settings className="size-4" />
                                <span>Manage Organizations</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/tenants" className="gap-2">
                                <Plus className="size-4" />
                                <span>Add Organization</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
