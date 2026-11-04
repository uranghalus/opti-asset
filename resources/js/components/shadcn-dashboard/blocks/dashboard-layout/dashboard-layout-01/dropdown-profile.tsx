import { Link } from '@inertiajs/react';
import { Bookmark, LogOut, ReceiptText, Settings, User } from 'lucide-react';
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
    defaultOpen?: boolean;
    align?: 'start' | 'center' | 'end';
    user?: ProfileUser;
    links?: ProfileLink[];
    settingsLinks?: ProfileLink[];
    onSignOut?: () => void;
};

type MenuItem = {
    label: string;
    icon: LucideIcon;
    destructive?: boolean;
};

const PROFILE_ITEMS: MenuItem[] = [
    { label: 'My Profile', icon: User },
    { label: 'My Subscription', icon: Bookmark },
    { label: 'My Invoice', icon: ReceiptText },
];

const SETTINGS_ITEMS: MenuItem[] = [
    { label: 'Account Settings', icon: Settings },
];

const LOGOUT_ITEM: MenuItem = {
    label: 'Signout',
    icon: LogOut,
    destructive: true,
};

const STATIC_USER: ProfileUser = {
    name: 'David McMichael',
    email: 'david.mcmichael@example.com',
    initials: 'DM',
    avatarUrl: 'https://images.shadcnspace.com/assets/profiles/user-11.jpg',
};

const itemClass = 'px-4 py-2.5 text-base cursor-pointer gap-3';

const userInfoClass = 'flex items-center gap-4 px-4 py-2.5 font-normal';

const renderStaticItems = (items: MenuItem[]) =>
    items.map(({ label, icon: Icon }) => (
        <DropdownMenuItem key={label} className={itemClass}>
            <Icon size={20} className="text-foreground" />
            <span>{label}</span>
        </DropdownMenuItem>
    ));

const renderLinkItems = (items: ProfileLink[]) =>
    items.map(({ label, icon: Icon, href }) => (
        <DropdownMenuItem key={label} asChild className={itemClass}>
            <Link href={href} prefetch>
                <Icon size={20} className="text-foreground" />
                <span>{label}</span>
            </Link>
        </DropdownMenuItem>
    ));

const ProfileDropdown = ({
    trigger,
    defaultOpen,
    align = 'end',
    user,
    links,
    settingsLinks,
    onSignOut,
}: Props) => {
    const userInfo = user ?? STATIC_USER;

    return (
        <DropdownMenu defaultOpen={defaultOpen}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align={align}>
                <DropdownMenuGroup>
                    {/* User Info */}
                    <DropdownMenuLabel className={userInfoClass}>
                        <div className="relative">
                            <Avatar className="size-10">
                                {userInfo.avatarUrl ? (
                                    <AvatarImage
                                        src={userInfo.avatarUrl}
                                        alt={userInfo.name}
                                    />
                                ) : null}
                                <AvatarFallback>
                                    {userInfo.initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute right-0 bottom-0 size-2 rounded-full bg-success ring-2 ring-card" />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-lg font-semibold text-foreground">
                                {userInfo.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {userInfo.email}
                            </span>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    {/* Main Links */}
                    {links
                        ? renderLinkItems(links)
                        : renderStaticItems(PROFILE_ITEMS)}

                    <DropdownMenuSeparator />

                    {/* Settings */}
                    <DropdownMenuGroup>
                        {settingsLinks
                            ? renderLinkItems(settingsLinks)
                            : renderStaticItems(SETTINGS_ITEMS)}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    {onSignOut ? (
                        <DropdownMenuItem
                            variant="destructive"
                            className={itemClass}
                            onSelect={onSignOut}
                        >
                            <LogOut size={20} />
                            <span>Keluar</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            variant="destructive"
                            className={itemClass}
                        >
                            <LOGOUT_ITEM.icon size={20} />
                            <span>{LOGOUT_ITEM.label}</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProfileDropdown;
