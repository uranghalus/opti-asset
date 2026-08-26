import { usePage } from '@inertiajs/react';
import { Link, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Boxes,
    Building2,
    Settings,
    Menu,
    X,
    ChevronLeft,
    Bell,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { NotificationBell } from '@/components/notification-bell';
import { SearchModal } from '@/components/search-modal';
import { TenantSwitcher } from '@/components/tenant-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sidebarData } from '@/data/sidebar';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { dashboard } from '@/routes';
import type { User } from '@/types';

type Props = {
    isMobile: boolean;
    open: boolean;
    onClose: () => void;
};

const NAV_ITEMS = [
    { href: dashboard(), icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/assets', icon: Boxes, label: 'Aset' },
    { href: '/organizations', icon: Building2, label: 'Organisasi' },
    { href: '/settings/profile', icon: Settings, label: 'Pengaturan' },
] as const;

export function MobileBottomNav() {
    const { auth } = usePage().props as { auth?: { user?: User } };
    const user = auth?.user;

    return (
        <nav
            className="glass-panel fixed right-0 bottom-0 left-0 z-50 border-t border-border/30 bg-background/90 shadow-2xl backdrop-blur-xl lg:hidden"
            role="navigation"
            aria-label="Navigasi utama mobile"
        >
            <div className="grid grid-cols-4">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        prefetch
                        className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground active:text-primary"
                        onClick={() => router.reload()}
                    >
                        <item.icon
                            className="size-5 stroke-2"
                            strokeWidth={2}
                        />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
            <div className="h-1 bg-gradient-to-r from-primary/30 via-transparent to-primary/30" />
        </nav>
    );
}
