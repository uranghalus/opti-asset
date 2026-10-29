import { Link } from '@inertiajs/react';

import { useEffect } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';

import { NavMain } from '@/components/nav-main';

import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';

import { sidebarData } from '@/data/sidebar';

import { cn } from '@/lib/utils';

import { dashboard } from '@/routes';

type Props = {
    isMobile?: boolean;

    open?: boolean;

    onClose?: () => void;
};

export function AppSidebar({ isMobile = false, open = false }: Props) {
    const sidebarClassName = cn(
        'sidebar-glass border-r border-border-subtle transition-all duration-300',

        isMobile &&
            'fixed top-0 left-0 z-50 h-full w-[300px] max-w-[85vw] shadow-[var(--shadow-elevated)]',

        !open && isMobile && '-translate-x-full',
    );

    return (
        <Sidebar
            collapsible="icon"

            variant="sidebar"

            className={sidebarClassName}
        >
            <SidebarHeader className="h-20 shrink-0 justify-center border-b border-border-subtle px-2 pt-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"

                            asChild

                            className="group/logo h-14 gap-3.5 rounded-2xl px-3 transition-all duration-300 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-slate-200/50 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_4px_12px_rgba(0,0,0,0.03)] data-[state=open]:bg-transparent dark:hover:bg-slate-800/40 dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]"
                        >
                            <Link
                                href={dashboard()}
                                className="flex w-full items-center"
                            >
                                {/* Soft UI Logo Container with Inset Highlight & Soft Ambient Shadow */}

                                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D82B7] via-[#2571A1] to-[#1E5F8A] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_-4px_rgba(45,130,183,0.45)] ring-1 ring-white/30 transition-transform duration-300 group-hover/logo:scale-105 group-data-[collapsible=icon]:size-9 dark:ring-white/10">
                                    <AppLogoIcon className="size-5 fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />

                                    {/* Indicator status bernuansa Soft UI Glow */}

                                    <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] ring-2 ring-slate-100 dark:ring-slate-900" />
                                </div>

                                {/* Typography & Soft UI Pill Badge */}

                                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate font-heading text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                                            OptiAsset
                                        </span>

                                        <span className="rounded-full bg-[#2D82B7]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#2D82B7] dark:bg-[#2D82B7]/20 dark:text-sky-300">
                                            PRO
                                        </span>
                                    </div>

                                    <span className="truncate text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                        Sistem Manajemen Aset
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="sidebar-scrollbar gap-1 py-2">
                <NavMain groups={sidebarData.navGroups} />
            </SidebarContent>

            {!isMobile && (
                <SidebarFooter className="border-t border-border-subtle px-2 py-1.5">
                    <NavUser />
                </SidebarFooter>
            )}
        </Sidebar>
    );
}
