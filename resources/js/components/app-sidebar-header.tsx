import { usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
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
        <header className="glass-topbar flex h-16 shrink-0 items-center border-b border-border/50 px-4 transition-[width,height] ease-linear">
            {/* Mobile menu */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="flex w-72 flex-col border-r border-border/60 bg-card/80 p-0 backdrop-blur-xl"
                    >
                        <SheetTitle className="sr-only">
                            Navigation menu
                        </SheetTitle>
                        <SheetHeader className="flex items-center justify-end border-b border-border/60 px-4 py-3">
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground" />
            </div>

            {/* Search bar */}
            <div className="ml-4 flex-1 lg:ml-6">
                <SearchModal />
            </div>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-1">
                <NotificationBell />
                <ThemeToggle />

                {/* Separator */}
                <div className="mx-2 h-6 w-px bg-border" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-foreground hover:bg-muted"
                        >
                            <Avatar className="h-7 w-7 overflow-hidden rounded-full ring-2 ring-border">
                                <AvatarImage src={userAvatar} alt={userName} />
                                <AvatarFallback className="rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
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
