import { router, usePage } from '@inertiajs/react';
import { Palette, ShieldCheck, User } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import ProfileDropdown from '@/components/shadcn-dashboard/blocks/dashboard-layout/dashboard-layout-01/dropdown-profile';
import type { ProfileLink } from '@/components/shadcn-dashboard/blocks/dashboard-layout/dashboard-layout-01/dropdown-profile';
import Search from '@/components/shadcn-dashboard/blocks/dashboard-layout/dashboard-layout-01/search';
import { TenantSelector } from '@/components/tenant-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { getSidebarLinks } from '@/lib/sidebar-links';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { User as AuthUser } from '@/types/auth';

type DashboardHeaderProps = {
    auth: {
        user: AuthUser | null;
    };
    tenant?: {
        code?: string;
    } | null;
};

const profileLinks: ProfileLink[] = [
    {
        label: 'Profil Saya',
        icon: User,
        href: edit().url,
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

/**
 * Header sticky layout `dashboard-layout-01`: pemicu sidebar di kiri, kontrol
 * aplikasi (search, tenant, notifikasi, tema) plus dropdown profil di kanan.
 *
 * Harus dipakai di dalam `SidebarProvider` karena memakai `SidebarTrigger`.
 */
export function DashboardLayoutHeader() {
    const page = usePage();
    const { auth, tenant } = page.props as unknown as DashboardHeaderProps;
    const user = auth.user;
    const tenantCode = tenant?.code ?? null;
    const getInitials = useInitials();

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
            <SidebarTrigger
                aria-label="Buka menu navigasi"
                className="cursor-pointer"
            />

            <div className="flex items-center gap-4">
                <Search links={getSidebarLinks(tenantCode)} />
                <TenantSelector />
                <NotificationBell />
                <ThemeToggle />

                {user && (
                    <ProfileDropdown
                        trigger={
                            <div
                                id="profile-dropdown-trigger"
                                className="cursor-pointer rounded-full"
                            >
                                <Avatar className="size-7 rounded-full">
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
                            </div>
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
