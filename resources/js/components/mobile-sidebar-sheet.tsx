'use client';

import { Link, router } from '@inertiajs/react';
import { UserCircle, LayoutDashboard } from 'lucide-react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { TenantSwitcher } from '@/components/tenant-switcher';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { sidebarData } from '@/data/sidebar';
import { useCan } from '@/hooks/use-can';
import { dashboard, logout } from '@/routes';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export function MobileSidebarSheet({ isOpen, onClose }: Props) {
    const can = useCan();

    const visibleGroups = sidebarData.navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                const permission = item.permission;

                return (
                    !permission ||
                    permission.actions.some((action) =>
                        can(`${permission.resource}.${action}`),
                    )
                );
            }),
        }))
        .filter((group) => group.items.length > 0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="left"
                className="ease-out-[cubic-bezier(0.16,1,0.3,1)] flex w-[300px] max-w-[85vw] animate-in flex-col border-r border-border/60 bg-card p-0 backdrop-blur-xl duration-300 slide-in-from-left"
            >
                <SheetHeader className="flex items-center border-b border-border/60 px-4 py-3">
                    <SheetTitle className="text-lg font-semibold text-foreground">
                        Menu Navigasi
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    {/* Brand */}
                    <Link
                        href={dashboard()}
                        className="mb-4 flex items-center gap-3 px-2 py-3"
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB23E] to-[#B892FF] shadow-lg ring-1 shadow-[#B892FF]/25 ring-white/25">
                            <AppLogoIcon className="size-6 fill-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-base font-bold tracking-tight text-foreground">
                                Opti-Asset
                            </span>
                            <span className="block truncate text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                Asset Management
                            </span>
                        </div>
                    </Link>

                    {/* Tenant Switcher */}
                    <div className="mb-4">
                        <TenantSwitcher />
                    </div>

                    {/* Navigation Groups */}
                    <div className="flex w-full flex-col">
                        <SidebarContent className="gap-2">
                            {visibleGroups.map((group, groupIndex) => (
                                <SidebarGroup
                                    key={group.title}
                                    className="px-1 py-0"
                                >
                                    <SidebarGroupLabel className="mb-1 h-auto px-2 py-0 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                        {group.title}
                                    </SidebarGroupLabel>
                                    <SidebarMenu className="gap-0.5">
                                        {group.items.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className="group/nav-item relative h-10 overflow-hidden rounded-lg px-3 text-sm font-medium text-muted-foreground transition-all duration-150 ease-out hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Link
                                                        href={item.url}
                                                        prefetch
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary opacity-0 transition-all duration-200 group-hover/nav-item:opacity-100" />
                                                        {item.icon && (
                                                            <div className="relative flex size-5 shrink-0 items-center justify-center">
                                                                <item.icon
                                                                    className={`size-5 text-muted-foreground transition-colors duration-150 group-hover/nav-item:text-primary`}
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="ml-3 truncate">
                                                            {item.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                    {groupIndex < visibleGroups.length - 1 && (
                                        <div className="mx-1 my-2 h-px bg-border/50" />
                                    )}
                                </SidebarGroup>
                            ))}
                        </SidebarContent>
                    </div>
                </div>
                <div className="pb-safe mt-auto flex flex-col gap-3 border-t border-border/60 bg-card p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/settings/profile"
                            onClick={onClose}
                            className="block"
                        >
                            <Button
                                variant="outline"
                                className="h-10 w-full justify-center gap-2 text-sm font-medium"
                            >
                                <UserCircle
                                    className="size-4"
                                    strokeWidth={2}
                                />
                                Profil
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="h-10 w-full justify-center gap-2 border-destructive/20 text-sm font-medium text-destructive"
                            onClick={() => {
                                router.post(logout());
                                onClose();
                            }}
                        >
                            <LayoutDashboard
                                className="size-4"
                                strokeWidth={2}
                            />
                            Keluar
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
