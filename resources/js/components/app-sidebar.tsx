import { usePage } from '@inertiajs/react';

import SimpleBar from 'simplebar-react';

import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { NavCollapse } from '@/components/nav-collapse';
import { NavSecondary } from '@/components/nav-secondary';
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
            variant="inset"
            collapsible="icon"
            side="left"
            className="border-r border-border bg-background"
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
                <SimpleBar style={{ height: '100%' }}>
                    <SidebarGroup
                        className="flex items-center justify-center group-data-[state=collapsed]:px-2 px-3 py-4"
                    >
                        <div className="px-0 group-data-[state=collapsed]:px-0 w-full flex flex-col gap-4">
                            <NavCollapse groups={sidebarData.navGroups} />
                        </div>
                    </SidebarGroup>
                </SimpleBar>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <div className="flex flex-col gap-2">
                    <NavSecondary />
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
