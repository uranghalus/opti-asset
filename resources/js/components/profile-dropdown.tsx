import { Link } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
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

export type ProfileLink = {
    label: string;
    icon: LucideIcon;
    href: string;
};

type ProfileUser = {
    name: string;
    email: string;
    initials: string;
    avatarUrl?: string | null;
};

type Props = {
    trigger: ReactElement;
    user: ProfileUser;
    links?: ProfileLink[];
    onSignOut?: () => void;
    align?: 'start' | 'center' | 'end';
};

const itemClass = 'px-4 py-2 text-sm cursor-pointer gap-3';

const userInfoClass = 'flex items-center gap-3 px-4 py-2 font-normal';

const renderLinkItems = (items: ProfileLink[]) =>
    items.map(({ label, icon: Icon, href }) => (
        <DropdownMenuItem key={label} asChild className={itemClass}>
            <Link href={href} prefetch>
                <Icon size={16} />
                <span>{label}</span>
            </Link>
        </DropdownMenuItem>
    ));

export function ProfileDropdown({
    trigger,
    user,
    links,
    onSignOut,
    align = 'end',
}: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

            <DropdownMenuContent className="w-72 shadow-overlay" align={align}>
                <DropdownMenuGroup>
                    {/* Info pengguna */}
                    <DropdownMenuLabel className={userInfoClass}>
                        <Avatar className="size-9">
                            {user.avatarUrl ? (
                                <AvatarImage
                                    src={user.avatarUrl}
                                    alt={user.name}
                                />
                            ) : null}
                            <AvatarFallback>{user.initials}</AvatarFallback>
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

                    {/* Tautan profil */}
                    {links && links.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                {renderLinkItems(links)}
                            </DropdownMenuGroup>
                        </>
                    )}

                    {/* Keluar */}
                    {onSignOut && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                className={itemClass}
                                onSelect={onSignOut}
                            >
                                <LogOut size={16} />
                                <span>Keluar</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
