import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function NotificationBell() {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-expanded={open}
                    aria-label="Notifikasi"
                    className="size-11 shrink-0 cursor-pointer rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
                >
                    <Bell className="size-5" aria-hidden="true" />
                    <span className="sr-only">Notifikasi</span>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 rounded-lg border-border bg-popover p-0 shadow-overlay"
            >
                <div className="border-b border-border px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">
                        Notifikasi
                    </span>
                </div>

                {/* Empty state jujur — tidak ada data mock, tidak ada aksi mati */}
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <Bell
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <p className="text-sm text-muted-foreground">
                        Belum ada notifikasi
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
