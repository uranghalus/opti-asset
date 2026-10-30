import { usePage } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function AppHeader({ pageTitle, pageSub }: { pageTitle?: string; pageSub?: string }) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const isMobile = useIsMobile();

    return (
        <header
            className="sticky top-0 z-50 flex items-center gap-4 border-b border-border-subtle px-4 py-3 glass-topbar backdrop-blur-[16px] bg-glass"
        >
            {isMobile && (
                <button
                    className="size-9 rounded-[11px] bg-card-2 border border-border-subtle grid place-items-center text-text-muted hover:text-text-primary hover:border-border-highlight hover:-translate-y-[1px] transition-all duration-150"
                    aria-label="Buka menu navigasi"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            )}

            <div className="flex flex-col gap-0.5 min-w-0">
                <h1 className={cn(
                    'font-heading text-[19px] leading-1.2 font-bold text-text-primary',
                    pageTitle ? '' : 'hidden'
                )}>
                    {pageTitle}
                </h1>
                {pageSub && (
                    <p className="text-[12px] text-text-tertiary leading-none">
                        {pageSub}
                    </p>
                )}
            </div>

            <div className="ml-auto flex items-center gap-2 min-w-[200px] md:min-w-[320px]">
                <div className="flex items-center gap-2 rounded-[12px] border border-border-subtle bg-card px-3 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]">
                    <SearchIcon className="size-4 shrink-0 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Cari aset, kode, atau barcode…"
                        className="bg-transparent border-none outline-none text-text-primary font-inherit text-[13px] w-full"
                    />
                    <kbd className="hidden md:block font-mono text-[10.5px] text-text-tertiary border border-border-highlight rounded-[6px] px-1.5 py-0.5 bg-card-2 whitespace-nowrap">
                        ⌘K
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <Button
                    variant="soft-primary"
                    size="sm"
                    className="px-3 text-[13px] font-semibold whitespace-nowrap"
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Aset Baru</span>
                </Button>
                <ThemeToggle />
                <NotificationBell />
                <div className="mx-1 h-4 w-px bg-border-subtle" />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="soft-secondary"
                            size="icon"
                            className="size-8 flex items-center gap-2 rounded-[11px] bg-card-2 border border-border-subtle text-text-primary hover:bg-surface-hover hover:text-text-primary hover:-translate-y-[1px] transition-all duration-150"
                        >
                            <Avatar className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-border-subtle">
                                <AvatarImage
                                    src={auth.user?.avatar}
                                    alt={auth.user?.name}
                                />
                                <AvatarFallback className="rounded-full bg-gradient-to-tr from-brand to-brand-2 text-[10px] font-semibold text-white">
                                    {getInitials(auth.user?.name ?? '')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden max-w-[100px] truncate text-sm xl:block text-text-primary">
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
