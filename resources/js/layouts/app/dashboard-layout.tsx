import { isValidElement, type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

type PageLayoutMeta = {
    breadcrumbs?: BreadcrumbItemType[];
};

/**
 * Membaca metadata `breadcrumbs` dari static `Page.layout` (konvensi halaman:
 * `PageName.layout = { breadcrumbs: [...] }` atau fungsi yang menerima page props).
 */
function resolveBreadcrumbs(
    children: ReactNode,
    pageProps: Record<string, unknown>,
): BreadcrumbItemType[] {
    if (!isValidElement(children)) {
        return [];
    }

    const layout = (children.type as { layout?: unknown }).layout;
    if (!layout) {
        return [];
    }

    const meta = (
        typeof layout === 'function'
            ? (layout as (props: Record<string, unknown>) => PageLayoutMeta)(
                  pageProps,
              )
            : layout
    ) as PageLayoutMeta | null;

    return Array.isArray(meta?.breadcrumbs) ? meta.breadcrumbs : [];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { props } = usePage();
    const breadcrumbs = resolveBreadcrumbs(children, props);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="overflow-x-hidden bg-transparent"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
