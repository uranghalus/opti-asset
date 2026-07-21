import { Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TenantCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        domain: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tenants');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Create Organization"
                    description="Create a new organization."
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
                        Create Organization
                    </Button>
                </div>
            </form>
        </div>
    );
}
