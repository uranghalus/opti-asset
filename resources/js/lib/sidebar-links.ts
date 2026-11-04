import { sidebarData } from '@/data/sidebar';
import type { SidebarNavGroup, SidebarNavItem } from '@/types/navigation';

export type SidebarLink = {
    title: string;
    href: string;
};

/**
 * Prepends the active tenant code to an app path so links stay scoped to
 * the current tenant: `/assets` with tenant `acme` becomes `/acme/assets`.
 *
 * Without an active tenant (super admin) the URL is returned untouched, and
 * redundant slashes are trimmed so `/`, `` and `//foo` never produce `//`.
 */
export function toTenantUrl(url: string, tenantCode: string | null): string {
    if (!tenantCode) {
        return url;
    }

    const path = url.replace(/^\/+|\/+$/g, '');

    if (path === '') {
        return `/${tenantCode}`;
    }

    return `/${tenantCode}/${path}`;
}

/**
 * Flattens every sidebar item — including nested sub-items on `items` —
 * into plain `{ title, href }` links carrying the tenant prefix.
 *
 * Items without a `url` (group labels, icon-only entries) are skipped so the
 * result never contains an undefined `href`.
 */
export function getSidebarLinks(tenantCode: string | null): SidebarLink[] {
    const links: SidebarLink[] = [];

    const collect = (item: SidebarNavItem): void => {
        if (item.url) {
            links.push({
                title: item.title,
                href: toTenantUrl(item.url, tenantCode),
            });
        }

        if (item.items?.length) {
            item.items.forEach(collect);
        }
    };

    sidebarData.navGroups.forEach((group: SidebarNavGroup) => {
        group.items.forEach(collect);
    });

    return links;
}
