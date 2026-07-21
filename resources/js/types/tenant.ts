export type Tenant = {
    id: number;
    name: string;
    domain: string;
    role?: string;
    created_at: string;
    updated_at: string;
};

export type PageProps = {
    [key: string]: unknown;
};
