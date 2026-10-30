import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    ScanLine,
    Settings,
    Boxes,
} from 'lucide-react';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/tenant';
import { index as assetsIndex } from '@/routes/tenant/assets';
import { scan as assetsScan } from '@/routes/tenant/assets';
import { edit as profileEdit } from '@/routes/profile';

/**
 * Tab bawah mobile â€” P2 thumb-first (DESIGN.md Â§6): 5 tab, 44px+ sentuh,
 * Scan di tengah sebagai aksi lapangan paling sering. Semua URL lewat
 * Wayfinder (jangan hardcode), aktif mengikuti URL halaman.
 */

export function MobileBottomNav() {
    const { can } = useCan();
    const { currentUrl } = useCurrentUrl();
    const page = usePage().props as { tenant?: { code?: string } | null };
    const tenantCode = page.tenant?.code;

    const NAV_ITEMS = [
        {
            href: tenantCode ? dashboard({ tenant: tenantCode }).url : '/',
            icon: LayoutDashboard,
            label: 'Beranda',
            permission: null,
            match: (path) => path === '/dashboard' || path === '/',
        },
        {
            href: tenantCode ? assetsIndex({ tenant: tenantCode }).url : '/assets',
            icon: Boxes,
            label: 'Aset',
            permission: 'asset.view',
            match: (path) => path.startsWith('/assets') && path !== '/assets/scan',
        },
        {
            href: tenantCode ? assetsScan({ tenant: tenantCode }).url : '/assets/scan',
            icon: ScanLine,
            label: 'Pindai',
            permission: 'asset.view',
            match: (path) => path.startsWith('/assets/scan'),
        },
        {
            href: profileEdit(),
            icon: Settings,
            label: 'Profil',
            permission: null,
            match: (path) => path.startsWith('/settings'),
        },
    ];

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.permission || can(item.permission),
    );

    return (
        <nav
            aria-label="Navigasi utama mobile"
            className={cn(
                'fixed inset-x-0 bottom-0 z-50 lg:hidden',
                'border-t border-border-subtle bg-card shadow-soft',
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
                                    'flex h-[56px] min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors duration-200',
                                    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-inset',
                                    isActive
                                        ? 'text-brand'
                                        : 'text-text-tertiary active:text-text-secondary',
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'relative flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-200',
                                        isActive && 'bg-brand-subtle',
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
