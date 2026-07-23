import { usePage } from '@inertiajs/react';
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
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

export function AppHeader() {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();

    return (
        <header
            className="flex h-14 shrink-0 items-center gap-3 border-b px-4"
            style={{
                background: 'linear-gradient(135deg, #00175A 0%, #000C3D 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
            }}
        >
            <div className="ml-auto flex items-center gap-1">
                <SearchModal />
                <NotificationBell />
                <ThemeToggle />

                {/* Separator */}
                <div className="mx-1 h-5 w-px bg-white/15" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex h-8 items-center gap-2 rounded-lg px-2 text-white/80 hover:bg-white/10 hover:text-white"
                        >
                            <Avatar className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-white/20">
                                <AvatarImage
                                    src={auth.user?.avatar}
                                    alt={auth.user?.name}
                                />
                                <AvatarFallback className="rounded-full bg-[#006FCF] text-[10px] font-semibold text-white">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden max-w-[100px] truncate text-sm xl:block">
                                {auth.user?.name}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth.user && <UserMenuContent user={auth.user} />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
