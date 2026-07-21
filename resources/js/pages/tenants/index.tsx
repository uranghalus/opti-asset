import { Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Tenant {
    id: number;
    name: string;
    domain: string;
    role: string;
    created_at: string;
    updated_at: string;
}

interface TenantsIndexProps {
    tenants: Tenant[];
    current_tenant_id: number | null;
}

export default function TenantsIndex({
    tenants,
    current_tenant_id,
}: TenantsIndexProps) {
    const handleDelete = (tenant: Tenant) => {
        if (confirm(`Are you sure you want to delete "${tenant.name}"?`)) {
            router.delete(`/tenants/${tenant.id}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Organizations"
                    description="Manage your organizations and switch between them."
                />
                <Button asChild>
                    <Link href="/tenants">Create Organization</Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">
                                        {tenant.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {tenant.domain}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-[#006FCF]/10 px-2 py-1 text-xs font-medium text-[#006FCF]">
                                            {tenant.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {current_tenant_id === tenant.id ? (
                                            <span className="inline-flex items-center rounded-full bg-[#00875A]/10 px-2 py-1 text-xs font-medium text-[#00875A]">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                                Inactive
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {current_tenant_id !==
                                                tenant.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            `/tenants/${tenant.id}/switch`,
                                                        )
                                                    }
                                                >
                                                    Switch
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/tenants/${tenant.id}/edit`}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(tenant)
                                                }
                                                className="text-[#C52720] hover:text-[#C52720]"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
