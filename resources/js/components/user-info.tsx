import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-7 w-7 overflow-hidden rounded-md">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-md bg-sidebar-primary/10 text-sidebar-primary text-[0.65rem] font-semibold">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-medium text-[0.75rem]">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-[0.625rem] text-sidebar-foreground/50">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
