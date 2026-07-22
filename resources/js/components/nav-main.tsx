import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { SidebarNavGroup, SidebarNavItem } from '@/types/navigation';

export function NavMain({ groups = [] }: { groups: SidebarNavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            {groups.map((group, groupIndex) => (
                <SidebarGroup key={group.title} className="px-2 py-0">
                    <SidebarGroupLabel className="sidebar-label mb-1 mt-0">
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-px w-0.5 bg-sidebar-primary/20" />
                            {group.title}
                        </span>
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-0">
                        {group.items.map((item, itemIndex) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.url)}
                                    tooltip={{ children: item.title }}
                                    className="group/nav-item relative rounded-md px-1.5 py-1 text-sidebar-foreground/60 transition-all duration-100 ease-out hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                                >
                                    <Link href={item.url} prefetch>
                                        {item.icon && (
                                            <div className="relative flex h-5 w-5 items-center justify-center">
                                                <item.icon className="h-3.5 w-3.5 text-sidebar-primary/50 transition-all duration-100 group-hover/nav-item:text-sidebar-primary data-[active=true]:text-sidebar-primary" />
                                            </div>
                                        )}
                                        <span className="font-medium text-[0.7rem] tracking-tight">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    {groupIndex < groups.length - 1 && (
                        <div className="sidebar-divider my-0.5" />
                    )}
                </SidebarGroup>
            ))}
        </>
    );
}