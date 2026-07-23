import { usePage } from '@inertiajs/react';
import { Menu, Plus, X } from 'lucide-react';
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

export function AppSidebarHeader() {
    const { auth } = usePage().props as {
        auth?: { user?: { name?: string; avatar?: string } };
    };
    const getInitials = useInitials();

    const userName = auth?.user?.name ?? '';
    const userAvatar = auth?.user?.avatar;

    return (
        <header className="flex h-16 shrink-0 items-center border-b border-[#D5D9DC] bg-white px-4 transition-[width,height] ease-linear dark:border-[#1e293b] dark:bg-[#0f172a]">
            {/* Mobile menu */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-[#53565A] hover:bg-[#F7F8F9] hover:text-[#1A1A1A] dark:text-[#B7C3D9] dark:hover:bg-white/[0.06] dark:hover:text-white"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="flex w-72 flex-col border-r border-[#D5D9DC] bg-white p-0 dark:border-[#1e293b] dark:bg-[#0f172a]"
                    >
                        <SheetTitle className="sr-only">
                            Navigation menu
                        </SheetTitle>
                        <SheetHeader className="flex items-center justify-end border-b border-[#D5D9DC] px-4 py-3 dark:border-[#1e293b]">
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#86888C] hover:text-[#1A1A1A] dark:text-[#B7C3D9] dark:hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar Trigger */}
            <div className="hidden lg:block">
                <SidebarTrigger className="-ml-1 h-8 w-8 text-[#86888C] hover:bg-[#F7F8F9] hover:text-[#1A1A1A] dark:text-[#B7C3D9] dark:hover:bg-white/[0.06] dark:hover:text-white" />
            </div>

            {/* Search bar */}
            <div className="ml-4 flex-1 lg:ml-6">
                <SearchModal />
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-1">
                <Button
                    variant="default"
                    size="sm"
                    className="hidden h-9 gap-1.5 rounded-lg bg-[#006FCF] px-3 text-[13px] font-semibold text-white shadow-sm shadow-[#006FCF]/20 hover:bg-[#1374D4] active:bg-[#00509E] sm:flex dark:bg-[#006FCF] dark:hover:bg-[#1374D4]"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Item</span>
                </Button>

                <NotificationBell />
                <ThemeToggle />

                {/* Separator */}
                <div className="mx-2 h-6 w-px bg-[#D5D9DC] dark:bg-[#1e293b]" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-[#1A1A1A] hover:bg-[#F7F8F9] hover:text-[#1A1A1A] dark:text-white dark:hover:bg-white/[0.06]"
                        >
                            <Avatar className="h-7 w-7 overflow-hidden rounded-full ring-2 ring-[#D5D9DC] dark:ring-[#1e293b]">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="rounded-full bg-[#006FCF] text-[11px] font-semibold text-white">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden max-w-[100px] truncate text-sm font-medium xl:block">
                                {userName}
                            </span>
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
