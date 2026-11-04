import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type NavItem = {
    label?: string;
    isSection?: boolean;
    title?: string;
    icon?: LucideIcon;
    href?: string;
    children?: NavItem[];
};

export function NavMain({ items }: { items: NavItem[] }) {
    const [activeParent, setActiveParent] = React.useState<string | null>(
        items.find((i) => !i.isSection)?.title || null,
    );
    const [activeChild, setActiveChild] = React.useState<string | null>(null);

    return (
        <>
            {items.map((item, index) => (
                <NavMainItem
                    key={item.title || item.label || index}
                    item={item}
                    activeParent={activeParent}
                    setActiveParent={setActiveParent}
                    activeChild={activeChild}
                    setActiveChild={setActiveChild}
                />
            ))}
        </>
    );
}

function NavMainItem({
    item,
    activeParent,
    setActiveParent,
    activeChild,
    setActiveChild,
}: {
    item: NavItem;
    activeParent: string | null;
    activeChild: string | null;
    setActiveParent: (val: string) => void;
    setActiveChild: (val: string | null) => void;
}) {
    const hasChildren = !!item.children?.length;
    const isParentActive = activeParent === item.title;
    // Falls back to the active parent until the user toggles it manually.
    const [openOverride, setOpenOverride] = React.useState<boolean | null>(
        null,
    );
    const isOpen = openOverride ?? isParentActive;
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed';

    // Section label
    if (item.isSection && item.label) {
        return (
            <SidebarGroup className="p-0 pt-5 first:pt-0">
                <SidebarGroupLabel className="p-0 text-xs font-medium text-sidebar-foreground uppercase">
                    {item.label}
                </SidebarGroupLabel>
            </SidebarGroup>
        );
    }

    // Item with children → collapsible
    if (hasChildren && item.title) {
        return (
            <SidebarGroup className="p-0">
                <SidebarMenu>
                    <Collapsible open={isOpen} onOpenChange={setOpenOverride}>
                        <SidebarMenuItem>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                                            isActive={isParentActive}
                                            onClick={() =>
                                                setActiveParent(item.title!)
                                            }
                                            className={cn(
                                                'h-9 w-full cursor-pointer px-3 py-2 text-sm font-medium transition-colors',
                                                isParentActive
                                                    ? 'bg-primary! text-primary-foreground!'
                                                    : '',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon size={16} />
                                            )}
                                            <span>{item.title}</span>
                                            <ChevronRight
                                                className={cn(
                                                    'ml-auto transition-transform duration-200',
                                                    isOpen && 'rotate-90',
                                                )}
                                            />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    align="center"
                                    hidden={!isCollapsed || isMobile}
                                >
                                    {item.title}
                                </TooltipContent>
                            </Tooltip>
                            <CollapsibleContent>
                                <SidebarMenuSub className="me-0 pe-0">
                                    {item.children!.map((child, index) => (
                                        <NavMainSubItem
                                            key={child.title || index}
                                            item={child}
                                            activeParent={activeParent}
                                            setActiveParent={setActiveParent}
                                            activeChild={activeChild}
                                            setActiveChild={setActiveChild}
                                            parentTitle={item.title}
                                        />
                                    ))}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    // Item without children
    if (item.title) {
        return (
            <SidebarGroup className="p-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                            tooltip={item.title}
                            isActive={isParentActive}
                            onClick={() => {
                                setActiveParent(item.title!);
                                setActiveChild(null);
                            }}
                            className={cn(
                                'h-9 cursor-pointer px-3 py-2 text-sm font-medium transition-colors',
                                isParentActive
                                    ? 'bg-primary! text-primary-foreground!'
                                    : '',
                            )}
                            asChild
                        >
                            <a href={item.href ?? '#'}>
                                {item.icon && <item.icon />}
                                {item.title}
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return null;
}

function NavMainSubItem({
    item,
    activeParent,
    setActiveParent,
    activeChild,
    setActiveChild,
    parentTitle,
}: {
    item: NavItem;
    activeParent: string | null;
    activeChild: string | null;
    setActiveParent: (val: string) => void;
    setActiveChild: (val: string | null) => void;
    parentTitle?: string;
}) {
    const hasChildren = !!item.children?.length;
    const [isOpen, setIsOpen] = React.useState(false);

    if (hasChildren && item.title) {
        return (
            <SidebarMenuSubItem>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild className="w-full">
                        <SidebarMenuSubButton
                            id={`nav-sub-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                            className="h-9 px-3 py-2 text-sm font-medium"
                        >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight
                                className={cn(
                                    'ml-auto transition-transform duration-200',
                                    isOpen && 'rotate-90',
                                )}
                            />
                        </SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub className="me-0 pe-0">
                            {item.children!.map((child, index) => (
                                <NavMainSubItem
                                    key={child.title || index}
                                    item={child}
                                    activeParent={activeParent}
                                    setActiveParent={setActiveParent}
                                    activeChild={activeChild}
                                    setActiveChild={setActiveChild}
                                    parentTitle={parentTitle}
                                />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuSubItem>
        );
    }

    if (item.title) {
        return (
            <SidebarMenuSubItem className="w-full">
                <SidebarMenuSubButton
                    id={`nav-sub-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                        'w-full transition-colors',
                        activeChild === item.title
                            ? 'bg-muted! text-foreground!'
                            : '',
                    )}
                    isActive={activeChild === item.title}
                    onClick={() => {
                        setActiveParent(parentTitle || '');
                        setActiveChild(item.title!);
                    }}
                    asChild
                >
                    <a href={item.href ?? '#'}>{item.title}</a>
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        );
    }

    return null;
}
