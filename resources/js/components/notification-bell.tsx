import { useState } from 'react';
import { Bell, AlertTriangle, Circle, ChevronDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const unreadCount = 5; // This would come from API in reality

    const notifications = [
        {
            id: 1,
            title: 'Pemantauan Stok Rendah',
            message: 'Aset PRN-00123 (Laptop Dell) stok hanya 2 unit',
            time: '2 menit yang lalu',
            icon: AlertTriangle,
            type: 'warning',
        },
        {
            id: 2,
            title: 'Audit Aset Selesai',
            message: 'Audit kuartalan Q3 2026 telah selesai',
            time: '15 menit yang lalu',
            icon: Bell,
            type: 'success',
        },
        {
            id: 3,
            title: 'Permohonan Mutasi Aset',
            message: 'Tim IT memohon pemindahan 15 unit monitor ke Gedung B',
            time: '1 jam yang lalu',
            icon: Circle,
            type: 'info',
        },
        {
            id: 4,
            title: 'Peringatan Pemeliharaan',
            message: 'AC Server Room jadwal pemeliharaan besok pagi',
            time: '2 jam yang lalu',
            icon: Eye,
            type: 'info',
        },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative group h-9 w-9"
                >
                    <Bell className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors duration-150" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium ring-2 ring-sidebar">
                            <span className="leading-none">{Math.min(unreadCount, 99)}</span>
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 border-sidebar-border/50 bg-sidebar-card shadow-xl">
                <div className="px-4 py-3 border-b border-sidebar-border/50 bg-sidebar">
                    <h3 className="text-sm font-semibold text-sidebar-foreground">
                        Notifikasi ({unreadCount} baru)
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 rounded hover:bg-sidebar-accent/50"
                        onClick={() => {/* mark all as read */}}
                    >
                        <Circle className="h-3 w-3 text-sidebar-foreground/40" />
                    </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1 p-2">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className="flex items-start gap-3 px-2 py-2.5 rounded-lg border border-sidebar-border/30 hover:bg-sidebar-accent/50 transition-colors duration-100"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10">
                                    {notif.icon && (
                                        <notif.icon
                                            className={cn(
                                                notif.type === 'warning' && 'text-orange-500',
                                                notif.type === 'success' && 'text-green-500',
                                                notif.type === 'info' && 'text-blue-500',
                                                'text-sidebar-foreground/60',
                                                'h-4 w-4'
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex justify-between">
                                        <h4 className="text-sm font-medium text-sidebar-foreground truncate max-w-[200px]">
                                            {notif.title}
                                        </h4>
                                        <span className="text-xs text-sidebar-foreground/30">
                                            {notif.time}
                                        </span>
                                    </div>
                                    <p className="text-[0.7rem] text-sidebar-foreground/50 line-clamp-2">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-xs text-sidebar-foreground/40">
                            Tidak ada notifikasi baru
                        </div>
                    )}
                </div>
                <div className="border-t border-sidebar-border/50 px-4 py-2.5 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    >
                        Lihat Semua Notifikasi
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}