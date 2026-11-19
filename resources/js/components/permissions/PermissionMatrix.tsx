import { Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
    users_count: number;
    created_at: string;
};

type PermissionGroup = {
    group: string;
    permissions: Permission[];
};

type PermissionMatrixProps = {
    role: Role;
    groups: PermissionGroup[];
    onClose: () => void;
    onSave?: (permissionNames: string[]) => void;
    saving?: boolean;
};

export function PermissionMatrix({
    role,
    groups,
    onClose,
    onSave,
    saving = false,
}: PermissionMatrixProps) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(role.permissions.map((p) => p.name)),
    );

    const isSuperAdminRole = role.name === 'super-admin';

    const filteredGroups = useMemo(() => {
        const q = query.toLowerCase();

        return groups
            .map((group) => ({
                ...group,
                permissions: group.permissions.filter((p) =>
                    p.name.toLowerCase().includes(q),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [groups, query]);

    const isSuperAdminPermission = (permissionName: string): boolean => {
        return permissionName.startsWith('super-admin.');
    };

    const handleToggle = (permissionName: string) => {
        if (isSuperAdminRole && isSuperAdminPermission(permissionName)) {
            toast.error(
                'Izin super-admin tidak dapat diubah dari halaman peran. Gunakan menu Hak Akses SuperAdmin.',
            );

            return;
        }

        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(permissionName)) {
                next.delete(permissionName);
            } else {
                next.add(permissionName);
            }

            return next;
        });
    };

    const handleSave = () => {
        if (onSave) {
            onSave(Array.from(selected));
        }

        onClose();
    };

    const changed =
        selected.size !== role.permissions.length ||
        !role.permissions.every((p) => selected.has(p.name));

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[90vh] w-full flex-col sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ShieldCheck className="size-4" />
                        </span>
                        <DialogTitle>Atur Izin — {role.name}</DialogTitle>
                    </div>
                    <DialogDescription className="mt-1 text-sm text-muted-foreground">
                        {isSuperAdminRole
                            ? 'Izin super-admin.* dilindungi dan tidak dapat diubah dari sini.'
                            : 'Pilih izin yang dimiliki peran ini.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border/50 bg-card/70 px-4 py-3 backdrop-blur-sm">
                        <Shield className="size-4 shrink-0 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari izin..."
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredGroups.length === 0 && (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                Tidak ada izin yang cocok.
                            </div>
                        )}
                        {filteredGroups.map((group) => (
                            <div key={group.group} className="px-4 py-2">
                                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    {group.group}
                                </h3>
                                <div className="space-y-1">
                                    {group.permissions.map((permission) => {
                                        const isSuperAdminPerm =
                                            isSuperAdminPermission(
                                                permission.name,
                                            );
                                        const isChecked = selected.has(
                                            permission.name,
                                        );
                                        const disabled =
                                            isSuperAdminRole &&
                                            isSuperAdminPerm;

                                        return (
                                            <label
                                                key={permission.name}
                                                className={cn(
                                                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                                                    disabled
                                                        ? 'cursor-not-allowed bg-muted/30 text-muted-foreground'
                                                        : 'cursor-pointer bg-background hover:bg-accent',
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() =>
                                                            handleToggle(
                                                                permission.name,
                                                            )
                                                        }
                                                        disabled={disabled}
                                                    />
                                                    <span
                                                        className={cn(
                                                            disabled
                                                                ? 'text-muted-foreground/60'
                                                                : 'text-foreground',
                                                            isSuperAdminPerm
                                                                ? 'font-medium text-rose-500 dark:text-rose-400'
                                                                : '',
                                                        )}
                                                    >
                                                        {permission.name}
                                                        {isSuperAdminPerm && (
                                                            <span className="ml-1 text-[10px] tracking-tighter uppercase opacity-60">
                                                                (lindungi)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                {isChecked ? (
                                                    <ShieldCheck
                                                        className={cn(
                                                            'size-4 shrink-0',
                                                            disabled
                                                                ? 'text-muted-foreground'
                                                                : 'text-primary',
                                                        )}
                                                    />
                                                ) : null}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="my-0" />

                <DialogFooter className="flex flex-col gap-3 gap-4 px-4 py-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onClose()}
                        disabled={saving}
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !changed}>
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
