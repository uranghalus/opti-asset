import { LifeBuoy, BookOpen } from 'lucide-react';
import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function NavUser() {
    const navItems = [
        {
            title: 'Pusat Bantuan',
            url: '/help',
            icon: LifeBuoy,
        },
        {
            title: 'Dokumentasi',
            url: '/docs',
            icon: BookOpen,
        },
    ];

    return (
        <SidebarGroup className="mt-auto p-0">
            <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className="h-full cursor-pointer">
                                <Link href={item.url} prefetch>
                                    <div className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md">
                                        <item.icon
                                            className="size-5 shrink-0 text-muted-foreground"
                                        />
                                        <span className="truncate font-medium text-muted-foreground whitespace-nowrap">
                                            {item.title}
                                        </span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
