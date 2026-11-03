import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSidebar } from '@/components/ui/sidebar';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { SidebarNavGroup } from '@/types/navigation';

interface NavCollapseProps {
    groups: SidebarNavGroup[];
    className?: string;
}

export function NavCollapse({ groups, className }: NavCollapseProps) {
    const { state } = useSidebar();
    const { isCurrentUrl } = useCurrentUrl();
    const isCollapse = state === 'collapsed';
    const page = usePage().props as { tenant?: { code?: string } | null };
    const tenantCode = page.tenant?.code;

    const tenantUrl = (url: string) => {
        if (!tenantCode) {
            return url;
        }

        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

        return `/${tenantCode}/${cleanUrl}`;
    };

    const isActiveRoute = (url: string): boolean => isCurrentUrl(tenantUrl(url));

    return (
        <>
            {groups.map((group) => (
                <div key={group.title}>
                    {/* Heading */}
                    <span
                        className={cn(
                            'text-xs uppercase block font-semibold text-muted-foreground mb-2 transition-all duration-200',
                            isCollapse
                                ? 'text-center group-hover:text-start group-data-[state=expanded]:text-start'
                                : ''
                        )}
                    >
                        {isCollapse ? (
                            <>
                                <span className="group-hover:hidden group-data-[state=expanded]:hidden">
                                    ...
                                </span>
                                <span className="hidden group-hover:inline group-data-[state=expanded]:inline">
                                    {group.title}
                                </span>
                            </>
                        ) : (
                            group.title
                        )}
                    </span>

                    <SidebarMenu className="space-y-1">
                        {group.items.map((item) => {
                            const active = isActiveRoute(item.url);

                            return (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            'flex items-center gap-3 w-full group relative group-data-[state=collapsed]:px-2.5 px-3 py-2 my-0.5 transition-all duration-200 rounded-md',
                                            active && 'bg-primary text-background font-medium',
                                            className
                                        )}
                                    >
                                        <Link href={tenantUrl(item.url)} prefetch>
                                            <div className="flex items-center gap-3 w-full">
                                                {item.icon && (
                                                    <item.icon
                                                        className={cn(
                                                            'h-4 w-4 shrink-0',
                                                            active
                                                                ? 'text-background'
                                                                : 'text-muted-foreground'
                                                        )}
                                                    />
                                                )}
                                                <span
                                                    className={cn(
                                                        'font-medium hide-menu whitespace-nowrap',
                                                        active ? 'font-bold' : ''
                                                    )}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </div>
            ))}
        </>
    );
}
