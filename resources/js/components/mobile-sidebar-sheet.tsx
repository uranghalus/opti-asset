'use client';

import { Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { X, LayoutDashboard, Boxes, Building2, Settings, UserCircle, Network, ShieldCheck, KeyRound, MapPin, Move, History, ArchiveX, Tags, Package, Upload, Sliders } from 'lucide-react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { NotificationBell } from '@/components/notification-bell';
import { TenantSwitcher } from '@/components/tenant-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { sidebarData } from '@/data/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { logout } from '@/routes';
import type { User } from '@/types';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

function getIconComponent(iconName: string) {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
        LayoutDashboard,
        Boxes,
        Building2,
        Settings,
        UserCircle,
        Network,
        ShieldCheck,
        KeyRound,
        MapPin,
        Move,
        History,
        ArchiveX,
        Tags,
        Package,
        Upload,
        Sliders,
    };

    return icons[iconName] || LayoutDashboard;
}

export function MobileSidebarSheet({ isOpen, onClose }: Props) {
    const { auth } = usePage().props as { auth?: { user?: User } };
    const user = auth?.user;

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
                className="flex w-[300px] max-w-[85vw] flex-col border-r border-border/60 bg-card p-0 backdrop-blur-xl animate-in slide-in-from-left duration-300 ease-out-[cubic-bezier(0.16,1,0.3,1)]"
            >
                <SheetHeader className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <SheetTitle className="text-lg font-semibold text-foreground">
                        Menu Navigasi
                    </SheetTitle>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            onClick={onClose}
                            aria-label="Tutup menu"
                        >
                            <X className="h-5 w-5" strokeWidth={2} />
                        </Button>
                    </SheetTrigger>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 px-3">
                    {/* Brand */}
                    <Link href={dashboard()} className="flex items-center gap-3 px-2 py-3 mb-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1374D4] to-[#006FCF] shadow-lg ring-1 shadow-[#006FCF]/25 ring-white/25">
                            <AppLogoIcon className="size-6 fill-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="truncate block text-base font-bold tracking-tight text-foreground">
                                Opti-Asset
                            </span>
                            <span className="truncate block text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                Asset Management
                            </span>
                        </div>
                    </Link>

                    {/* Tenant Switcher */}
                    <div className="mb-4">
                        <TenantSwitcher />
                    </div>

                    {/* Navigation Groups */}
                    <Sidebar>
                        <SidebarContent className="gap-2">
                            {sidebarData.navGroups.map((group, groupIndex) => (
                                <SidebarGroup key={group.title} className="px-1 py-0">
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
                                                        <span
                                                            className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 opacity-0 group-hover/nav-item:opacity-100"
                                                        />
                                                        {item.icon && (
                                                            <div className="relative flex size-5 items-center justify-center shrink-0">
                                                                <item.icon
                                                                    className={`size-5 transition-colors duration-150 text-muted-foreground group-hover/nav-item:text-primary`}
                                                                    strokeWidth={2}
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
                                    {groupIndex < sidebarData.navGroups.length - 1 && (
                                        <div className="mx-1 my-2 h-px bg-border/50" />
                                    )}
                                </SidebarGroup>
                            ))}
                        </SidebarContent>
                    </Sidebar>
                </div>

                {/* Footer with User Menu */}
                <SidebarFooter className="border-t border-border/60 p-3 space-y-3">
                    {/* Notifications & Theme */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <ThemeToggle />
                        <div className="flex-1" />
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        {user && <UserInfo user={user} showEmail />}
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                                {user?.name ?? 'User'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user?.email ?? ''}
                            </p>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="grid grid-cols-2 gap-2">
                        <Link href="/settings/profile" onClick={onClose}>
                            <Button
                                variant="outline"
                                className="h-9 w-full justify-center gap-2 text-sm font-medium"
                            >
                                <UserCircle className="size-4" strokeWidth={2} />
                                Profil
                            </Button>
                        </Link>
                        <Link href={logout()} as="button" onClick={onClose}>
                            <Button
                                variant="outline"
                                className="h-9 w-full justify-center gap-2 text-sm font-medium text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                <LayoutDashboard className="size-4" strokeWidth={2} />
                                Keluar
                            </Button>
                        </Link>
                    </div>
                </SidebarFooter>
            </SheetContent>
        </Sheet>
    );
}