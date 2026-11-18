import {
    ChevronDown,
    LogOut,
    Palette,
    ShieldCheck,
    User,
} from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { User as AuthUser } from '@/types/auth';

export function NavUser() {
    const { auth } = usePage().props as unknown as {
        auth: { user: AuthUser | null };
    };
    const user = auth.user;
    const getInitials = useInitials();

    if (!user) {
        return null;
    }

    const profileLinks = [
        { label: 'Profil Saya', icon: User, href: editProfile().url },
        { label: 'Keamanan', icon: ShieldCheck, href: editSecurity().url },
        { label: 'Tampilan', icon: Palette, href: editAppearance().url },
    ];

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-pointer"
                            aria-label="Menu pengguna"
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
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                            <ChevronDown
                                className="ml-auto size-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        side="top"
                        align="end"
                        sideOffset={8}
                        className="w-64"
                    >
                        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2.5 font-normal">
                            <Avatar className="size-9">
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
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-foreground">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            {profileLinks.map(({ label, icon: Icon, href }) => (
                                <DropdownMenuItem
                                    key={label}
                                    asChild
                                    className="cursor-pointer gap-3 px-3 py-2 text-sm"
                                >
                                    <Link href={href} prefetch>
                                        <Icon
                                            size={18}
                                            className="text-foreground"
                                        />
                                        <span>{label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer gap-3 px-3 py-2 text-sm"
                            onSelect={() => router.post(logout.url())}
                        >
                            <LogOut size={18} />
                            <span>Keluar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
