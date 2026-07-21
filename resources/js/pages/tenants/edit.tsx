import { Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TenantEditProps {
    tenant: {
        id: number;
        name: string;
        domain: string;
        role: string;
    };
}

export default function TenantEdit({ tenant }: TenantEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name,
        domain: tenant.domain,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/tenants/${tenant.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Edit Organization"
                    description={`Editing "${tenant.name}".`}
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-lg border p-6">
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Organization name"
                            />
                            {errors.name && (
                                <p className="text-sm text-[#C52720]">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input
                                id="domain"
                                value={data.domain}
                                onChange={(e) =>
                                    setData('domain', e.target.value)
                                }
                                placeholder="organization.example.com"
                            />
                            {errors.domain && (
                                <p className="text-sm text-[#C52720]">
                                    {errors.domain}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/tenants">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
