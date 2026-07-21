import type { ReactNode } from 'react';
import type { User } from '@/types/auth';
import type { BreadcrumbItem } from '@/types/navigation';
import type { Tenant } from '@/types/tenant';

export type SharedPageProps = {
    name: string;
    auth: {
        user: User | null;
    };
    sidebarOpen: boolean;
    currentTenant: Tenant | null;
    tenants: Tenant[];
};

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
