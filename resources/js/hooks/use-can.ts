import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type PageProps = {
    auth?: {
        user?: {
            roles?: string[];
            permissions?: string[];
        } | null;
    } | null;
};

function userIsSuperAdmin(roles: string[] | undefined): boolean {
    return (roles ?? []).some((role) => {
        const normalized = role.toLowerCase().replace(/_/g, '-');

        return normalized === 'super-admin' || normalized === 'superadmin';
    });
}

/**
 * Client-side permission check driven by the shared `auth.user.permissions`
 * list (see HandleInertiaRequests). Mirrors Gate::before: super-admin sees
 * everything regardless of stored permissions.
 */
export function useCan() {
    const page = usePage().props as unknown as PageProps;

    return useMemo(() => {
        const roles = page.auth?.user?.roles;
        const isSuperAdmin = userIsSuperAdmin(roles);
        const granted = new Set(page.auth?.user?.permissions ?? []);

        return (permission: string): boolean => {
            if (isSuperAdmin) {
                return true;
            }

            return granted.has(permission);
        };
    }, [page.auth]);
}
