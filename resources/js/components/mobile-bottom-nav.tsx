import { Link, router } from '@inertiajs/react';
import { LayoutDashboard, Boxes, Building2, Settings } from 'lucide-react';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';

const NAV_ITEMS = [
    { href: dashboard(), icon: LayoutDashboard, label: 'Dashboard', permission: null },
    { href: '/assets', icon: Boxes, label: 'Aset', permission: 'asset.view' },
    {
        href: '/organizations',
        icon: Building2,
        label: 'Organisasi',
        permission: 'organization.view',
    },
    {
        href: '/settings/profile',
        icon: Settings,
        label: 'Pengaturan',
        permission: null,
    },
] as const;

export function MobileBottomNav() {
    const { can } = useCan();
    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.permission || can(item.permission),
    );

    // Static class map — Tailwind's JIT cannot see dynamic template classes.
    const gridClass =
        visibleItems.length === 4
            ? 'grid-cols-4'
            : visibleItems.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2';

    return (
        <nav
            className="glass-panel fixed right-0 bottom-0 left-0 z-50 border-t border-border/30 bg-background/90 shadow-2xl backdrop-blur-xl lg:hidden"
            role="navigation"
            aria-label="Navigasi utama mobile"
        >
            <div className={gridClass}>
                {visibleItems.map((item) => (
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
