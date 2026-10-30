import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    return (
        <div className="p-1 space-y-1">
            {/* Header User Card dengan Soft Inset Depth */}
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-100/70 p-2 dark:bg-slate-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>

            {/* Separator Fading Gradient */}
            <DropdownMenuSeparator className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-800/80" />

            <DropdownMenuGroup className="space-y-0.5">
                <DropdownMenuItem asChild>
                    <Link
                        className={cn(
                            'group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200',
                            'transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-white hover:translate-x-0.5'
                        )}
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-500 transition-colors group-hover:bg-[#2D82B7]/15 group-hover:text-[#2D82B7] dark:bg-slate-700/50 dark:text-slate-400 dark:group-hover:bg-[#2D82B7]/30 dark:group-hover:text-sky-300">
                            <Settings className="size-3.5" />
                        </div>
                        <span>Pengaturan</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Separator Fading Gradient */}
            <DropdownMenuSeparator className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-800/80" />

            {/* Logout Item dengan Soft Destructive Style */}
            <DropdownMenuItem
                className={cn(
                    'group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400',
                    'transition-all duration-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 hover:translate-x-0.5'
                )}
                onSelect={() => {
                    cleanup();
                    router.post(logout.url());
                }}
                data-test="logout-button"
            >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-rose-100/80 text-rose-600 transition-colors group-hover:bg-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:group-hover:bg-rose-900/60">
                    <LogOut className="size-3.5" />
                </div>
                <span>Keluar</span>
            </DropdownMenuItem>
        </div>
    );
}