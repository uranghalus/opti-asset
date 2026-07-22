import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: {
        resource: string;
        actions: string[];
    };
};

export type SidebarTeam = {
    name: string;
    logo: LucideIcon;
    plan: string;
};

export type SidebarNavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    permission?: {
        resource: string;
        actions: string[];
    };
};

export type SidebarNavGroup = {
    title: string;
    items: SidebarNavItem[];
};

export type SidebarData = {
    teams: SidebarTeam[];
    navGroups: SidebarNavGroup[];
};
