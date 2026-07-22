import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { SearchModal } from '@/components/search-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <>
            {/* Main header — deep navy premium bar */}
            <header
                className="sticky top-0 z-50 border-b"
                style={{
                    background: 'linear-gradient(135deg, #00175A 0%, #000C3D 100%)',
                    borderColor: 'rgba(183,195,217,0.12)',
                    boxShadow: '0 2px 8px rgba(0,23,90,0.28)',
                }}
            >
                <div className="mx-auto flex h-16 items-center gap-3 px-4 md:max-w-7xl">

                    {/* Mobile hamburger */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between"
                                style={{ background: '#00175A', borderColor: 'rgba(183,195,217,0.15)' }}
                            >
                                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <div className="flex items-center gap-2 px-1 pt-1">
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-md"
                                            style={{ background: '#006FCF' }}
                                        >
                                            <AppLogoIcon className="h-5 w-5 fill-current text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-white">Opti-Asset</span>
                                    </div>
                                </SheetHeader>
                                <div className="flex flex-1 flex-col p-4 pt-6">
                                    <nav className="flex flex-col gap-1">
                                        {mainNavItems.map((item) => (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-120',
                                                    isCurrentUrl(item.href)
                                                        ? 'bg-white/15 text-white'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                                                )}
                                            >
                                                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                                                {item.title}
                                            </Link>
                                        ))}
                                    </nav>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Brand logo */}
                    <Link href={dashboard()} prefetch className="flex items-center gap-2.5 shrink-0">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-md"
                            style={{ background: '#006FCF' }}
                        >
                            <AppLogoIcon className="h-5 w-5 fill-current text-white" />
                        </div>
                        <span className="hidden text-sm font-semibold tracking-tight text-white sm:block">
                            Opti-Asset
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="mx-1 hidden h-5 w-px bg-white/15 lg:block" />

                    {/* Desktop nav */}
                    <nav className="hidden h-full items-center gap-1 lg:flex">
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'relative flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-120',
                                    isCurrentUrl(item.href)
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/65 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                                {item.title}
                                {isCurrentUrl(item.href) && (
                                    <span
                                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full"
                                        style={{ background: '#006FCF' }}
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Right-side actions */}
                    <div className="ml-auto flex items-center gap-1">
                        {/* Search */}
                        <SearchModal />

                        {/* Notification bell */}
                        <NotificationBell />

                        {/* Theme toggle */}
                        <ThemeToggle />

                        {/* Separator */}
                        <div className="mx-1 h-5 w-px bg-white/15" />

                        {/* User avatar dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex h-9 items-center gap-2 rounded-lg px-2 text-white/80 hover:bg-white/10 hover:text-white"
                                >
                                    <Avatar className="h-7 w-7 overflow-hidden rounded-full ring-2" style={{ ringColor: 'rgba(255,255,255,0.2)' }}>
                                        <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                        <AvatarFallback
                                            className="rounded-full text-xs font-semibold text-white"
                                            style={{ background: '#006FCF' }}
                                        >
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[120px] truncate text-sm font-medium lg:block">
                                        {auth.user?.name}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                {auth.user && <UserMenuContent user={auth.user} />}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Breadcrumb bar */}
            {breadcrumbs.length > 1 && (
                <div
                    className="flex w-full border-b"
                    style={{
                        background: '#F7F8F9',
                        borderColor: '#ECEDEE',
                    }}
                >
                    <div className="mx-auto flex h-11 w-full items-center justify-start px-4 text-sm md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
