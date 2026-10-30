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
        unread: true,
    },
    {
        id: 2,
        title: 'Audit Aset Selesai',
        message: 'Audit kuartalan Q3 2026 telah selesai dikonfirmasi',
        time: '15m lalu',
        icon: CheckCircle,
        type: 'success',
        unread: true,
    },
    {
        id: 3,
        title: 'Permohonan Mutasi Aset',
        message: 'Tim IT memohon pemindahan 15 unit monitor ke Gedung B',
        time: '1j lalu',
        icon: Info,
        type: 'info',
        unread: false,
    },
    {
        id: 4,
        title: 'Peringatan Pemeliharaan',
        message: 'AC Server Room jadwal pemeliharaan rutin besok pagi',
        time: '2j lalu',
        icon: Info,
        type: 'info',
        unread: false,
    },
];

const typeStyles: Record<
    string,
    { iconColor: string; bgGradient: string; ringColor: string }
> = {
    warning: {
        iconColor: 'text-amber-500 dark:text-amber-400',
        bgGradient: 'from-amber-500/20 to-amber-500/5',
        ringColor: 'ring-amber-500/20',
    },
    success: {
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        bgGradient: 'from-emerald-500/20 to-emerald-500/5',
        ringColor: 'ring-emerald-500/20',
    },
    info: {
        iconColor: 'text-[#2D82B7] dark:text-sky-300',
        bgGradient: 'from-[#2D82B7]/20 to-[#2D82B7]/5',
        ringColor: 'ring-[#2D82B7]/20',
    },
};

export function NotificationBell() {
    const unreadCount = notifications.filter((n) => n.unread).length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'group relative size-10 rounded-2xl transition-all duration-300',
                        'bg-slate-100/80 dark:bg-slate-800/60',
                        'border border-slate-200/80 dark:border-slate-700/50',
                        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)]',
                        'dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.3)]',
                        'hover:-translate-y-0.5 hover:border-[#2D82B7]/40 hover:bg-white dark:hover:bg-slate-800',
                        'hover:shadow-[0_6px_20px_-4px_rgba(45,130,183,0.25)]',
                        'data-[state=open]:border-[#2D82B7] data-[state=open]:bg-white dark:data-[state=open]:bg-slate-800',
                        'data-[state=open]:ring-4 data-[state=open]:ring-[#2D82B7]/15',
                        'data-[state=open]:shadow-[0_8px_24px_-4px_rgba(45,130,183,0.3)]'
                    )}
                >
                    {/* Soft Icon Badge Container */}
                    <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D82B7]/20 to-[#2D82B7]/5 text-[#2D82B7] ring-1 ring-[#2D82B7]/20 transition-transform duration-300 group-hover:scale-110 dark:from-[#2D82B7]/30 dark:to-[#2D82B7]/10 dark:text-sky-300">
                        <Bell className="size-4" />
                    </div>

                    {/* Unread Glowing Pill Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-1 text-[9px] font-extrabold text-white shadow-[0_2px_8px_rgba(244,63,94,0.5)] ring-2 ring-white dark:ring-slate-900">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifikasi</span>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className={cn(
                    'w-80 sm:w-96 overflow-hidden rounded-2xl p-1.5 backdrop-blur-xl',
                    'border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95',
                    'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)]',
                    'dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]'
                )}
            >
                {/* Header dengan Inset Soft Card */}
                <div className="flex items-center justify-between rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                    <div className="flex items-center gap-2">
                        <span className="font-heading text-xs font-extrabold text-slate-800 dark:text-slate-100">
                            Notifikasi
                        </span>
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            {unreadCount} baru
                        </span>
                    </div>
                    <button className="text-[10px] font-bold text-[#2D82B7] transition-colors hover:underline dark:text-sky-300">
                        Tandai Dibaca
                    </button>
                </div>

                {/* Scrollable Notification List */}
                <div className="max-h-80 space-y-1 overflow-y-auto p-1 py-1.5 sidebar-scrollbar">
                    {notifications.map((notif) => {
                        const style =
                            typeStyles[notif.type] ?? typeStyles.info;

                        return (
                            <div
                                key={notif.id}
                                className={cn(
                                    'group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 cursor-pointer',
                                    'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:translate-x-0.5',
                                    notif.unread &&
                                    'bg-[#2D82B7]/5 dark:bg-[#2D82B7]/10'
                                )}
                            >
                                {/* Soft Gradient Icon Badge */}
                                <div
                                    className={cn(
                                        'flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-transform duration-200 group-hover:scale-105',
                                        style.bgGradient,
                                        style.ringColor
                                    )}
                                >
                                    <notif.icon
                                        className={cn('size-4', style.iconColor)}
                                    />
                                </div>

                                {/* Content Details */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {notif.title}
                                        </p>
                                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            {notif.time}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                        {notif.message}
                                    </p>
                                </div>

                                {/* Active Glowing Dot Indicator */}
                                {notif.unread && (
                                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#2D82B7] shadow-[0_0_6px_rgba(45,130,183,0.8)] dark:bg-sky-400" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Soft Footer Button */}
                <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <Button
                        variant="ghost"
                        className="w-full justify-center rounded-xl py-2 text-xs font-bold text-[#2D82B7] transition-all duration-200 hover:bg-[#2D82B7]/10 dark:text-sky-300 dark:hover:bg-[#2D82B7]/20"
                    >
                        Lihat Semua Notifikasi
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}