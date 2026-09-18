import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type SharedAuth = {
    user?: {
        roles?: string[];
        permissions?: string[];
    } | null;
    isSuperAdmin?: boolean;
};

/**
 * Client-side permission checks mirroring the server's Gate. Reads the
 * shared `auth.permissions` array; super-admin bypasses everything,
 * mirroring Gate::before.
 */
export function useCan() {
    const { auth } = usePage().props as unknown as { auth: SharedAuth };

    return useMemo(() => {
        const permissions = new Set(auth.user?.permissions ?? []);
        const isSuperAdmin = auth.isSuperAdmin === true;

        const can = (permission: string): boolean =>
            isSuperAdmin || permissions.has(permission);

        const canAny = (names: string[]): boolean =>
            isSuperAdmin || names.some((name) => permissions.has(name));

        return {
            can,
            canAny,
            isSuperAdmin,
            roles: auth.user?.roles ?? [],
        };
    }, [auth.user?.permissions, auth.isSuperAdmin, auth.user?.roles]);
}
