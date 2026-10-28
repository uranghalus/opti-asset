import { router, useForm } from '@inertiajs/react';
import { ArrowRight, UserPlus, UserX, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { store as grantStore } from '@/routes/super-admin-grants';

type UserOption = {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
};

type SuperAdminGrantFormProps = {
    users: UserOption[];
    loading?: boolean;
};

const SUPER_ADMIN_EMAIL = 'superadmin@appdutamall.com';

export function SuperAdminGrantForm({
    users,
    loading = false,
}: SuperAdminGrantFormProps) {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [grantError, setGrantError] = useState<string | null>(null);

    const form = useForm({
        user_id: '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setGrantError(null);

        if (!selectedUserId) {
            setGrantError(
                'Pilih pengguna yang akan diberikan hak super-admin.',
            );

            return;
        }

        const selectedUser = users.find((u) => u.id === selectedUserId);

        if (selectedUser?.email === SUPER_ADMIN_EMAIL) {
            setGrantError(
                'Pengguna superadmin@appdutamall.com tidak dapat diberikan hak super-admin (sudah memiliki akses penuh).',
            );

            return;
        }

        if (selectedUser?.is_super_admin) {
            setGrantError('Pengguna ini sudah memiliki hak super-admin.');

            return;
        }

        form.setData('user_id', String(selectedUserId));

        router.post(grantStore().url, form.data, {
            onSuccess: () => {
                toast.success(
                    `Hak super-admin berhasil diberikan kepada ${selectedUser?.name}.`,
                );
                setSelectedUserId(null);
                form.reset();
                window.dispatchEvent(
                    new CustomEvent('super-admin-grant:changed'),
                );
            },
            onError: () => {
                setGrantError(
                    'Gagal memberikan hak super-admin. Coba lagi nanti.',
                );
            },
        });
    };

    const availableUsers = users.filter(
        (u) => !u.is_super_admin && u.email !== SUPER_ADMIN_EMAIL,
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-4 pt-2">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                        Berikan Hak SuperAdmin
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Pilih pengguna yang akan diberikan akses penuh ke
                        seluruh sistem.{' '}
                        <span className="font-medium text-rose-500 dark:text-rose-400">
                            superadmin@appdutamall.com tidak dapat dipilih.
                        </span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-2">
                    <Label htmlFor="super-admin-user-select">Pengguna</Label>
                    <Select
                        value={String(selectedUserId ?? '')}
                        onValueChange={(value) =>
                            setSelectedUserId(
                                value === '' ? null : parseInt(value, 10),
                            )
                        }
                        disabled={loading || availableUsers.length === 0}
                    >
                        <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70 text-sm shadow-sm backdrop-blur-xl">
                            <SelectValue placeholder="Pilih pengguna..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Pilih pengguna...</SelectItem>
                            <Separator />
                            {availableUsers.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={String(user.id)}
                                >
                                    {user.name}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {grantError && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                        <UserX className="mt-0.5 size-4 shrink-0" />
                        <span>{grantError}</span>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={
                        loading ||
                        !selectedUserId ||
                        availableUsers.length === 0
                    }
                    className="h-11 w-full"
                >
                    {loading ? (
                        <>
                            <ArrowRight className="mr-2 size-4 animate-spin" />
                            Memberikan hak...
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 size-4" />
                            Berikan Hak SuperAdmin
                        </>
                    )}
                </Button>

                {availableUsers.length === 0 && !loading && (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                        Tidak ada pengguna yang tersedia untuk diberikan hak
                        super-admin.
                    </div>
                )}
            </form>
        </div>
    );
}
