type PermissionMeta = {
    resource: string;
    actions: string[];
};

type PermissionChecker = {
    can: (permission: string) => boolean;
    canAny: (names: string[]) => boolean;
    isSuperAdmin: boolean;
};

/**
 * Check a sidebar item's permission metadata against the user's grants.
 * Items without metadata are always visible (e.g. Dashboard, Profil).
 */
export function canSeeNavItem(
    item: { permission?: PermissionMeta },
    checker: PermissionChecker,
): boolean {
    const meta = item.permission;

    if (!meta) {
        return true;
    }

    const names = meta.actions.map((action) => `${meta.resource}.${action}`);

    return checker.canAny(names);
}

/**
 * Filter nav groups, dropping items the user cannot see and groups left
 * empty by that filtering.
 */
export function filterNavGroups<
    T extends { items: Array<{ permission?: PermissionMeta }> },
>(groups: T[], checker: PermissionChecker): T[] {
    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => canSeeNavItem(item, checker)),
        }))
        .filter((group) => group.items.length > 0);
}

/**
 * Super-admin grant permission resources and actions.
 * Used for gate-based visibility on super-admin grants page.
 */
export const SUPER_ADMIN_PERMISSIONS = {
    resource: 'super-admin',
    actions: ['view', 'grant', 'revoke'],
} as const;

export type SuperAdminAction = 'view' | 'grant' | 'revoke';

/**
 * Build super-admin permission names (e.g. 'super-admin.view').
 */
export function superAdminPermission(action: SuperAdminAction): string {
    return `super-admin.${action}`;
}
