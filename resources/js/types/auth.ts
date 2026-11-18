export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    tenant_id?: string | null;
    roles?: string[];
    permissions?: string[];
    [key: string]: unknown;
};

export type TenantInfo = {
    id: string;
    name: string;
};

export type EmployeeSession = {
    id_employee: string;
    tenant_id: string;
    nik_employee: string;
    nama_employee: string;
    email: string | null;
    number: string | null;
    photo_url: string | null;
    department_id: string | null;
    division_id: string | null;
    id_position: string | null;
};

export type Auth = {
    user: User;
    isSuperAdmin: boolean;
    canSwitchTenant?: boolean;
    employee?: EmployeeSession | null;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
