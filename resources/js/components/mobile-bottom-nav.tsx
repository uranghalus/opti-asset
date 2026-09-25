import { Link } from '@inertiajs/react';
import {
    Building2,
    LayoutDashboard,
    ScanLine,
    Settings,
    Boxes,
} from 'lucide-react';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as assetsIndex } from '@/routes/assets';
import { scan as assetsScan } from '@/routes/assets';
import { index as organizationsIndex } from '@/routes/organizations';
import { edit as profileEdit } from '@/routes/profile';

/**
 * Tab bawah mobile — P2 thumb-first (DESIGN.md §6): 5 tab, 44px+ sentuh,
 * Scan di tengah sebagai aksi lapangan paling sering. Semua URL lewat
 * Wayfinder (jangan hardcode), aktif mengikuti URL halaman.
 */
type NavItem = {
    href: ReturnType<typeof dashboard>;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    permission: string | null;
    /** Kapan tab dianggap aktif — biasanya prefix path modul. */
    match: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
    {
        href: dashboard(),
        icon: LayoutDashboard,
        label: 'Beranda',
        permission: null,
        match: (path) => path === '/dashboard' || path === '/',
    },
    {
        href: assetsIndex(),
        icon: Boxes,
        label: 'Aset',
        permission: 'asset.view',
        /** Menu aktif juga di seluruh modul aset (detail/edit/impor). */
        match: (path) => path.startsWith('/assets') && path !== '/assets/scan',
    },
    {
        href: assetsScan(),
        icon: ScanLine,
        label: 'Pindai',
        permission: 'asset.view',
        match: (path) => path.startsWith('/assets/scan'),
    },
    {
        href: organizationsIndex(),
        icon: Building2,
        label: 'Organisasi',
        permission: 'organization.view',
        match: (path) => path.startsWith('/organizations'),
    },
    {
        href: profileEdit(),
        icon: Settings,
        label: 'Profil',
        permission: null,
        match: (path) => path.startsWith('/settings'),
    },
];

export function MobileBottomNav() {
    const { can } = useCan();
    const { currentUrl } = useCurrentUrl();

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.permission || can(item.permission),
    );

    return (
        <nav
            aria-label="Navigasi utama mobile"
            className={cn(
                'fixed inset-x-0 bottom-0 z-50 lg:hidden',
                'border-t border-border bg-card',
                'shadow-[0_-1px_3px_rgb(0_0_0/0.06)]',
                'pb-[env(safe-area-inset-bottom)]',
            )}
        >
            <ul className="grid grid-cols-5">
                {visibleItems.map((item) => {
                    const isActive = item.match(currentUrl);

                    return (
                        <li key={item.label} className="min-w-0">
                            <Link
                                href={item.href}
                                prefetch
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'flex h-[56px] min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors duration-150',
                                    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground active:text-foreground',
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'relative flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-150',
                                        isActive && 'bg-brand-muted',
                                    )}
                                >
                                    <item.icon
                                        className="size-5"
                                        strokeWidth={isActive ? 2.2 : 1.8}
                                        aria-hidden
                                    />
                                </span>
                                <span className="max-w-full truncate leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
