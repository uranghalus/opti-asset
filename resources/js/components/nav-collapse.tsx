import { Link, usePage } from '@inertiajs/react';
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
                    {/* Saat collapsed, judul tetap ada untuk screen reader */}
                    {isCollapse ? (
                        <span className="sr-only">{group.title}</span>
                    ) : (
                        <span className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
                            {group.title}
                        </span>
                    )}

                    <SidebarMenu className="space-y-1">
                        {group.items.map((item) => {
                            const active = isActiveRoute(item.url);

                            return (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-md border px-3 py-2 transition-colors duration-150 group-data-[state=collapsed]:px-2.5',
                                            active
                                                ? 'border-primary-muted-border bg-primary-muted font-medium text-primary'
                                                : 'border-transparent hover:bg-accent',
                                            className,
                                        )}
                                    >
                                        <Link href={tenantUrl(item.url)} prefetch>
                                            <div className="flex w-full items-center gap-3">
                                                {item.icon && (
                                                    <item.icon
                                                        className={cn(
                                                            'h-4 w-4 shrink-0',
                                                            active
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    />
                                                )}
                                                <span
                                                    className={cn(
                                                        'hide-menu whitespace-nowrap font-medium',
                                                        active && 'font-semibold',
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
