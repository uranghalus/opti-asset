import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TenantSwitcher } from '@/components/tenant-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { sidebarData } from '@/data/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="sidebar-glass border-r-0"
        >
            <SidebarHeader className="h-16 shrink-0 justify-center border-b border-sidebar-border px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-12 gap-3 px-2 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                        >
                            <Link href={dashboard()}>
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1374D4] to-[#006FCF] shadow-lg ring-1 shadow-[#006FCF]/25 ring-white/25 group-data-[collapsible=icon]:size-8">
                                    <AppLogoIcon className="size-5 fill-white" />
                                </div>
                                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                                        Opti-Asset
                                    </span>
                                    <span className="truncate text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/55 uppercase">
                                        Asset Management
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="sidebar-scrollbar gap-1 py-2">
                <div className="px-3 pt-1 pb-1 group-data-[collapsible=icon]:hidden">
                    <TenantSwitcher />
                </div>
                <NavMain groups={sidebarData.navGroups} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-2 py-1.5">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
