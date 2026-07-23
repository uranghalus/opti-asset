import { AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const notifications = [
    {
        id: 1,
        title: 'Pemantauan Stok Rendah',
        message: 'Aset PRN-00123 (Laptop Dell) stok hanya 2 unit',
        time: '2m lalu',
        icon: AlertTriangle,
        type: 'warning',
    },
    {
        id: 2,
        title: 'Audit Aset Selesai',
        message: 'Audit kuartalan Q3 2026 telah selesai',
        time: '15m lalu',
        icon: CheckCircle,
        type: 'success',
    },
    {
        id: 3,
        title: 'Permohonan Mutasi Aset',
        message: 'Tim IT memohon pemindahan 15 unit monitor ke Gedung B',
        time: '1j lalu',
        icon: Info,
        type: 'info',
    },
    {
        id: 4,
        title: 'Peringatan Pemeliharaan',
        message: 'AC Server Room jadwal pemeliharaan besok pagi',
        time: '2j lalu',
        icon: Info,
        type: 'info',
    },
];

const typeColors: Record<string, { icon: string; bg: string }> = {
    warning: { icon: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/15' },
    success: { icon: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
    info: { icon: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-500/15' },
};

export function NotificationBell() {
    const unreadCount = 5;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                            {Math.min(unreadCount, 99)}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 rounded-xl border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-2xl dark:shadow-black/40"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Notifikasi
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                        {unreadCount} baru
                    </span>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => {
                        const colors = typeColors[notif.type] ?? typeColors.info;
                        return (
                            <div
                                key={notif.id}
                                className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                        colors.bg,
                                    )}
                                >
                                    <notif.icon className={cn('h-4 w-4', colors.icon)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {notif.title}
                                        </p>
                                        <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                                            {notif.time}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        className="w-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        Lihat Semua Notifikasi
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
