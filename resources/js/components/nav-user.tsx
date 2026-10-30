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
import { cn } from '@/lib/utils';
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
                            className={cn(
                                'group/sidebar-item relative h-12 w-full justify-start gap-3 rounded-2xl px-2.5 transition-all duration-300',
                                'bg-slate-100/80 dark:bg-slate-800/60',
                                'border border-slate-200/80 dark:border-slate-700/50',
                                'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)]',
                                'dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.3)]',
                                'hover:-translate-y-0.5 hover:border-[#2D82B7]/40 hover:bg-white dark:hover:bg-slate-800',
                                'hover:shadow-[0_6px_20px_-4px_rgba(45,130,183,0.25)]',
                                'data-[state=open]:border-[#2D82B7] data-[state=open]:bg-white dark:data-[state=open]:bg-slate-800',
                                'data-[state=open]:ring-4 data-[state=open]:ring-[#2D82B7]/15',
                                'data-[state=open]:shadow-[0_8px_24px_-4px_rgba(45,130,183,0.3)]',
                                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
                            )}
                            data-test="sidebar-menu-button"
                        >
                            {user && <UserInfo user={user} showEmail />}
                            <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-slate-400 transition-all duration-200 group-hover/sidebar-item:text-slate-700 group-data-[state=open]/sidebar-item:rotate-180 dark:text-slate-500 dark:group-hover/sidebar-item:text-slate-200 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 backdrop-blur-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
                        align="end"
                        sideOffset={8}
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                    ? 'left'
                                    : 'top'
                        }
                    >
                        {user && <UserMenuContent user={user} />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}