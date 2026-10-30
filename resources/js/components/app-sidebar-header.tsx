import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TenantSelector } from '@/components/tenant-selector';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { SearchBar } from './search-bar';

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
            <SearchBar />

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
                <TenantSelector />
                <ThemeToggle />
                <NotificationBell />
                <div className="mx-1 h-4 w-px bg-border-subtle" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'group relative size-10 rounded-2xl transition-all duration-300',
                                'bg-slate-100/80 dark:bg-slate-800/60',
                                'border border-slate-200/80 dark:border-slate-700/50',
                                'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)]',
                                'dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.3)]',
                                'hover:-translate-y-0.5 hover:border-[#2D82B7]/40 hover:bg-white dark:hover:bg-slate-800',
                                'hover:shadow-[0_6px_20px_-4px_rgba(45,130,183,0.25)]',
                                'data-[state=open]:border-[#2D82B7] data-[state=open]:bg-white dark:data-[state=open]:bg-slate-800',
                                'data-[state=open]:ring-4 data-[state=open]:ring-[#2D82B7]/15',
                                'data-[state=open]:shadow-[0_8px_24px_-4px_rgba(45,130,183,0.3)]'
                            )}
                        >
                            {/* Soft Squircle Avatar Container */}
                            <Avatar className="size-7 overflow-hidden rounded-xl ring-2 ring-white/80 transition-transform duration-300 group-hover:scale-105 dark:ring-slate-700/60 shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
                                <AvatarImage
                                    src={userAvatar}
                                    alt={userName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#2D82B7] via-[#2571A1] to-[#1E5F8A] text-[11px] font-extrabold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Status Glow Dot */}
                            <span className="absolute bottom-1 right-1 size-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end"
                        sideOffset={8}
                        className={cn(
                            'w-60 overflow-hidden rounded-2xl p-1.5 backdrop-blur-xl',
                            'border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95',
                            'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)]',
                            'dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]'
                        )}>
                        {auth?.user && (
                            <UserMenuContent user={auth.user as any} />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
