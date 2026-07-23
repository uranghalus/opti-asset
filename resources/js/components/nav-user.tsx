import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User } from '@/types';

export function NavUser() {
    const { auth } = usePage().props as { auth?: { user?: User } };
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    const user = auth?.user;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group/sidebar-item h-11 gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-2 py-1 transition-all duration-150 hover:border-sidebar-ring/30 hover:bg-sidebar-accent data-[state=open]:border-sidebar-ring/30 data-[state=open]:bg-sidebar-accent"
                            data-test="sidebar-menu-button"
                        >
                            {user && <UserInfo user={user} showEmail />}
                            <ChevronsUpDown className="ml-auto size-3.5 text-sidebar-foreground/40 transition-colors group-hover/sidebar-item:text-sidebar-foreground/70" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                    ? 'left'
                                    : 'bottom'
                        }
                    >
                        {user && <UserMenuContent user={user} />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}