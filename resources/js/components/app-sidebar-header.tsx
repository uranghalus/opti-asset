import { usePage } from '@inertiajs/react';
import { Building2, Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { TenantSwitcher } from '@/components/tenant-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

type Props = {
    onMenuClick?: () => void;
};

export function AppSidebarHeader({ onMenuClick }: Props) {
    const { auth } = usePage().props as {
        auth?: { user?: { name?: string; avatar?: string } };
    };
    const getInitials = useInitials();

    const userName = auth?.user?.name ?? '';
    const userAvatar = auth?.user?.avatar;

    return (
        <header className="glass-topbar sticky top-0 z-50 flex items-center gap-3 border-b border-border-subtle bg-glass px-4 py-3 backdrop-blur-[16px] transition-[width,height] ease-linear">
            {/* Mobile menu */}
            <div className="lg:hidden">
                <Button
                    variant="soft-secondary"
                    size="icon"
                    className="bg-card-2 size-9 rounded-[11px] border border-border-subtle text-text-primary transition-all duration-150 hover:-translate-y-[1px] hover:border-border-highlight hover:text-text-primary"
                    onClick={onMenuClick}
                    aria-label="Buka menu navigasi"
                >
                    <Menu className="size-5" strokeWidth={1.8} />
                </Button>
            </div>

            {/* Desktop Sidebar Trigger */}
            <div className="hidden lg:block">
                <SidebarTrigger
                    className="bg-card-2 -ml-1 size-9 rounded-[11px] border border-border-subtle text-text-primary transition-all duration-150 hover:-translate-y-[1px] hover:border-border-highlight hover:text-text-primary"
                    onClick={onMenuClick}
                />
            </div>

            {/* Search bar */}
            <div className="ml-4 min-w-[200px] flex-1 md:min-w-[320px] lg:ml-6">
                <div className="flex items-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-text-tertiary"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21 -4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari aset, kode, atau barcode…"
                        className="font-inherit w-full border-none bg-transparent text-[13px] text-text-primary outline-none"
                    />
                    <kbd className="bg-card-2 hidden shrink-0 rounded-[6px] border border-border-highlight px-1.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap text-text-tertiary md:block">
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
                {/* Tenant switcher — lg+ full chip; md–lg compact icon-only */}
                <div className="ml-3 hidden lg:block">
                    <TenantSwitcher />
                </div>
                <div className="ml-3 md:flex lg:hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Pilih tenant"
                            >
                                <Building2 className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pilih tenant</TooltipContent>
                    </Tooltip>
                </div>
                <ThemeToggle />
                <NotificationBell />
                <div className="mx-1 h-4 w-px bg-border-subtle" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="soft-secondary"
                            size="icon"
                            className="bg-card-2 size-9 rounded-[11px] border border-border-subtle text-text-primary transition-all duration-150 hover:-translate-y-[1px] hover:bg-surface-hover hover:text-text-primary"
                        >
                            <Avatar className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-border-subtle">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="rounded-full bg-gradient-to-tr from-brand to-brand-2 text-[11px] font-semibold text-white">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth?.user && (
                            <UserMenuContent user={auth.user as any} />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
