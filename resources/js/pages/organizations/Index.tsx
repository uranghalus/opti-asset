import { router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import organizations from '@/routes/organizations';

type Tenant = {
    id: string;
    name: string;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type PageProps = {
    tenants: PaginatedData<Tenant>;
};

export default function OrganizationsIndex() {
    const { tenants } = usePage().props as unknown as PageProps;
    const [open, setOpen] = useState(false);
    const [editTenant, setEditTenant] = useState<Tenant | null>(null);
    const [search, setSearch] = useState('');

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.get(organizations.index().url, { search }, { preserveState: true, replace: true });
    };

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        router.post(organizations.store().url, {
            id: form.get('id'),
            name: form.get('name'),
        });
        setOpen(false);
    };

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!editTenant) {
            return;
        }

        const form = new FormData(e.currentTarget);
        router.patch(organizations.update(editTenant.id).url, {
            name: form.get('name'),
        });
        setEditTenant(null);
    };

    const handleDelete = (tenant: Tenant) => {
        if (confirm(`Hapus organisasi "${tenant.name}"?`)) {
            router.delete(organizations.destroy(tenant.id).url);
        }
    };

    const goToPage = (url: string | null) => {
        if (!url) { return; }
        router.get(url, {}, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Organisasi</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola data organisasi / tenant</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Tambah Organisasi
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Organisasi</DialogTitle>
                            <DialogDescription>Buat organisasi baru.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="id">ID Tenant</Label>
                                    <Input id="id" name="id" placeholder="contoh: acme-corp" required pattern="[a-z0-9\-]+" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input id="name" name="name" placeholder="PT Acme Corp" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Batal</Button>
                                </DialogClose>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari organisasi..."
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="secondary">Cari</Button>
            </form>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Dibuat</TableHead>
                            <TableHead className="w-24" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.data.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-mono text-xs">{tenant.id}</TableCell>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{tenant.created_at}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setEditTenant(tenant)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tenant)}>
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tenants.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                    Belum ada organisasi.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {tenants.last_page > 1 && (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!tenants.links[0]?.url}
                        onClick={() => goToPage(tenants.links[0]?.url)}
                    >
                        Sebelumnya
                    </Button>
                    {tenants.links.slice(1, -1).map((link, i) => (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() => goToPage(link.url)}
                        >
                            {link.label}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!tenants.links[tenants.links.length - 1]?.url}
                        onClick={() => goToPage(tenants.links[tenants.links.length - 1]?.url)}
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}

            <div className="text-center text-xs text-muted-foreground">
                {tenants.total} organisasi — halaman {tenants.current_page} dari {tenants.last_page}
            </div>

            <Dialog open={!!editTenant} onOpenChange={(o) => !o && setEditTenant(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organisasi</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>ID</Label>
                                <Input value={editTenant?.id ?? ''} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama</Label>
                                <Input id="edit-name" name="name" defaultValue={editTenant?.name ?? ''} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Batal</Button>
                            </DialogClose>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}