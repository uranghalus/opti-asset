import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { SidebarNavGroup } from '@/types/navigation';

export function NavMain({ groups = [] }: { groups: SidebarNavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { can } = useCan();
    const page = usePage().props as { tenant?: { code?: string } | null };
    const tenantCode = page.tenant?.code;

    const tenantUrl = (url: string) => {
        if (!tenantCode) return url;
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return `/${tenantCode}/${cleanUrl}`;
    };

    const visibleGroups = groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                const permission = item.permission;

                return (
                    !permission ||
                    permission.actions.some((action) =>
                        can(`${permission.resource}.${action}`),
                    )
                );
            }),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <>
            {visibleGroups.map((group, groupIndex) => (
                <SidebarGroup key={group.title} className="px-2.5 py-1">
                    <SidebarGroupLabel className="mt-2 mb-1.5 h-auto px-3 py-0 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                        {group.title}
                    </SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                        {group.items.map((item) => {
                            const href = tenantUrl(item.url);
                            const isActive = isCurrentUrl(href);

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={cn(
                                            'group/nav-item relative h-11 w-full justify-start gap-3 rounded-2xl px-3 text-xs font-bold transition-all duration-300',
                                            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
                                            isActive
                                                ? 'bg-gradient-to-r from-[#2D82B7] to-[#2571A1] text-white shadow-[0_8px_20px_-4px_rgba(45,130,183,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)]'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.03)] dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)] hover:-translate-y-0.5'
                                        )}
                                    >
                                        <Link href={href} prefetch className="flex items-center w-full">
                                            {item.icon && (
                                                <div
                                                    className={cn(
                                                        'flex size-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                                                        'group-data-[collapsible=icon]:size-8',
                                                        isActive
                                                            ? 'bg-white/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
                                                            : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover/nav-item:bg-[#2D82B7]/15 group-hover/nav-item:text-[#2D82B7] dark:group-hover/nav-item:text-sky-300'
                                                    )}
                                                >
                                                    <item.icon className="size-4 transition-transform duration-300 group-hover/nav-item:scale-110" />
                                                </div>
                                            )}

                                            <span className="truncate text-xs tracking-tight font-bold group-data-[collapsible=icon]:hidden">
                                                {item.title}
                                            </span>

                                            {/* Glowing indicator dot untuk menu yang aktif */}
                                            {isActive && (
                                                <span className="ml-auto size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] group-data-[collapsible=icon]:hidden" />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>

                    {/* Soft UI Inset Divider */}
                    {groupIndex < visibleGroups.length - 1 && (
                        <div className="mx-3 my-3 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-800/80" />
                    )}
                </SidebarGroup>
            ))}
        </>
    );
}