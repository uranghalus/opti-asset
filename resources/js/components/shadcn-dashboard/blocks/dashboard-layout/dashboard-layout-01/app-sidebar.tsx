import { Rocket, LifeBuoy, BookOpen } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavCollapse } from '@/components/nav-collapse';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { sidebarData } from '@/data/sidebar';

const navItems = [
    {
        title: 'Help Center',
        url: '/theme-pages/faq',
        icon: LifeBuoy,
    },
    {
        title: 'Documentation',
        url: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar className="h-full px-0 **:data-[slot=sidebar-inner]:h-full **:data-[slot=sidebar-inner]:bg-background">
            <div className="flex flex-col gap-2">
                {/* ---------------- Header ---------------- */}
                <SidebarHeader className="px-4 py-4">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <a href="/" className="h-full w-full">
                                <AppLogo />
                            </a>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                {/* ---------------- Content ---------------- */}
                <SidebarContent className="overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-100px)]">
                        <div className="px-4">
                            <NavCollapse groups={sidebarData.navGroups} />
                        </div>
                        {/* card */}
                        <div className="px-4 pt-5">
                            <div className="-mx-4 border-t border-b border-border px-5 py-5">
                                <div className="flex flex-col gap-5">
                                    {/* Plan info */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-4">
                                            {/* Header row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Rocket className="size-5 shrink-0" />
                                                    <span className="text-base leading-6 font-medium text-foreground">
                                                        Basic Plan
                                                    </span>
                                                </div>
                                                <span className="text-base leading-6 font-medium text-foreground">
                                                    70%
                                                </span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                                                <div className="h-full w-[70%] rounded-full bg-foreground" />
                                            </div>
                                        </div>
                                        {/* Usage text */}
                                        <p className="text-center text-sm leading-5 font-normal text-muted-foreground">
                                            68/100 monthly limit used
                                        </p>
                                    </div>
                                    {/* Upgrade button */}
                                    <Button className="h-9 w-full cursor-pointer rounded-lg bg-foreground text-sm font-medium text-background hover:bg-foreground/90">
                                        Upgrade
                                    </Button>
                                </div>
                            </div>
                            <SidebarGroup className="mt-auto pt-4">
                                <SidebarGroupContent>
                                    <SidebarMenu className="">
                                        {navItems.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    size="lg"
                                                    className="h-full cursor-pointer"
                                                >
                                                    <a href={item.url}>
                                                        <div className="flex w-full items-center gap-3">
                                                            <item.icon className="size-5 shrink-0 shadow-none" />
                                                            <div className="hide-menu flex flex-1 flex-col text-left text-sm leading-tight whitespace-nowrap">
                                                                <span className="truncate font-medium">
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </div>
                    </ScrollArea>
                </SidebarContent>
            </div>
        </Sidebar>
    );
}
