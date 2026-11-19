import {
    Palette,
    PanelLeft,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { SearchBar } from './search-bar';
import { SearchDialog } from './search-dialog';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';
import { TenantSelector } from './tenant-selector';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { User as AuthUser } from '@/types/auth';

type PageProps = {
    auth: {
        user: AuthUser | null;
    };
};

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { toggleSidebar } = useSidebar();
    const page = usePage();
    const { auth } = page.props as unknown as PageProps;
    const user = auth.user;
    const getInitials = useInitials();
    const [scrolled, setScrolled] = useState(false);

    // Bayangan sticky saat halaman digulir (DESIGN.md — Shell — Top Bar).
    // Dependensi `url`: cek ulang setelah navigasi Inertia karena posisi
    // scroll direset tanpa memicu event scroll.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 0);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [page.url]);

    const lastCrumb =
        breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1]
            : null;

    const profileLinks = [
        {
            label: 'Profil Saya',
            icon: User,
            href: editProfile().url,
        },
        {
            label: 'Keamanan',
            icon: ShieldCheck,
            href: editSecurity().url,
        },
        {
            label: 'Tampilan',
            icon: Palette,
            href: editAppearance().url,
        },
    ];

    return (
        <header
            data-scrolled={scrolled}
            className={cn(
                'sticky top-0 z-2 bg-background border-b border-border data-[scrolled=true]:shadow-sticky',
            )}
        >
            <div className="flex h-14 items-center gap-1.5 px-4 sm:gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 cursor-pointer rounded-md transition-colors duration-150 hover:bg-accent"
                    onClick={toggleSidebar}
                    aria-label="Buka menu navigasi"
                >
                    <PanelLeft className="size-5" />
                </Button>

                <Separator
                    orientation="vertical"
                    className="h-4 w-px shrink-0 bg-border max-sm:hidden"
                />

                <div className="min-w-0 truncate max-md:hidden">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>

                {/* Judul halaman menggantikan breadcrumbs di layar sempit */}
                {lastCrumb && (
                    <span className="min-w-0 truncate text-sm font-medium text-foreground md:hidden">
                        {lastCrumb.title}
                    </span>
                )}

                <div className="flex-1" />

                {/* Entry search mobile: ikon → dialog */}
                <div className="sm:hidden">
                    <SearchDialog />
                </div>

                <div className="hidden sm:block">
                    <SearchBar />
                </div>

                <TenantSelector />
                <ThemeToggle />
                <NotificationBell />

                {user && (
                    <ProfileDropdown
                        trigger={
                            <button
                                aria-label="Menu pengguna"
                                className="flex size-11 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-150 hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            >
                                <Avatar className="size-8 rounded-full">
                                    {user.avatar ? (
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        }
                        user={{
                            name: user.name,
                            email: user.email,
                            initials: getInitials(user.name),
                            avatarUrl: user.avatar ?? null,
                        }}
                        links={profileLinks}
                        onSignOut={() => router.post(logout.url())}
                    />
                )}
            </div>
        </header>
    );
}
