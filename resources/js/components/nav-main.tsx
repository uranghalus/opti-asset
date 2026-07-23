import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { SidebarNavGroup } from '@/types/navigation';

export function NavMain({ groups = [] }: { groups: SidebarNavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            {groups.map((group, groupIndex) => (
                <SidebarGroup key={group.title} className="px-2 py-0">
                    <SidebarGroupLabel className="mb-1 mt-0 h-auto px-2 py-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                        {group.title}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-0.5">
                        {group.items.map((item) => {
                            const isActive = isCurrentUrl(item.url);

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={`group/nav-item relative h-9 overflow-hidden rounded-lg px-2.5 text-sidebar-foreground/70 transition-all duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center ${isActive
                                            ? 'sidebar-nav-active font-medium text-sidebar-primary'
                                            : ''
                                            }`}
                                    >
                                        <Link href={item.url} prefetch>
                                            <span
                                                className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all duration-200 group-data-[collapsible=icon]:hidden ${isActive
                                                    ? 'opacity-100'
                                                    : 'opacity-0 group-hover/nav-item:opacity-40'
                                                    }`}
                                            />
                                            {item.icon && (
                                                <div className="relative flex size-5 items-center justify-center group-data-[collapsible=icon]:size-4">
                                                    <item.icon
                                                        className={`size-4 transition-colors duration-150 ${isActive
                                                            ? 'text-sidebar-primary'
                                                            : 'text-sidebar-foreground/45 group-hover/nav-item:text-sidebar-foreground'
                                                            }`}
                                                    />
                                                </div>
                                            )}
                                            <span className="text-[0.8rem] tracking-tight group-data-[collapsible=icon]:hidden">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                    {groupIndex < groups.length - 1 && (
                        <div className="mx-2 my-2 h-px bg-sidebar-border" />
                    )}
                </SidebarGroup>
            ))}
        </>
    );
}