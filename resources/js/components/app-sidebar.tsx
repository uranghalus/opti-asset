import { usePage } from '@inertiajs/react';

import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { NavCollapse } from '@/components/nav-collapse';
import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from '@/components/ui/sidebar';

import { sidebarData } from '@/data/sidebar';

export function AppSidebar() {
    const page = usePage().props as { tenant?: { code?: string } | null };
    const tenantCode = page.tenant?.code;

    return (
        <Sidebar
            collapsible="icon"
            side="left"
            className="border-r border-border bg-sidebar"
        >
            <SidebarHeader
                className="p-3 group-data-[state=collapsed]:px-2.5 flex flex-row items-center justify-between border-b border-border"
            >
                <AppLogo />
                <Badge className="group-data-[state=collapsed]:hidden" variant="secondary">
                    V.1.0
                </Badge>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup
                    className="flex items-center justify-center group-data-[state=collapsed]:px-2 px-3 py-4"
                >
                    <div className="px-0 group-data-[state=collapsed]:px-0 w-full flex flex-col gap-4">
                        <NavCollapse groups={sidebarData.navGroups} />
                    </div>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <div className="flex flex-col gap-2">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
