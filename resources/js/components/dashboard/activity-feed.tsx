import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const activities = [
    {
        name: 'Andi Pratama',
        initials: 'AP',
        action: 'memindahkan',
        target: 'Laptop Dell XPS 15',
        detail: 'ke Departemen Finance',
        time: '2m lalu',
        color: '#006FCF',
    },
    {
        name: 'Sari Dewi',
        initials: 'SD',
        action: 'menambahkan',
        target: '12 aset baru',
        detail: 'ke kategori Elektronik',
        time: '15m lalu',
        color: '#00875A',
    },
    {
        name: 'Budi Santoso',
        initials: 'BS',
        action: 'meminta',
        target: 'pemindahan 15 unit monitor',
        detail: 'ke Gedung B',
        time: '1j lalu',
        color: '#BF9B30',
    },
    {
        name: 'Maya Putri',
        initials: 'MP',
        action: 'menyelesaikan',
        target: 'audit kuartalan Q3',
        detail: '2026',
        time: '3j lalu',
        color: '#7C3AED',
    },
];

export function ActivityFeed() {
    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#00875A] uppercase">
                        Aktivitas
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Umpan Aktivitas
                    </h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-[#006FCF] hover:text-[#00509E]"
                >
                    Lihat Semua <ArrowRight className="h-3 w-3" />
                </Button>
            </div>
            <div className="flex flex-col gap-1">
                {activities.map((a, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[#F7F8F9]/50 dark:hover:bg-white/[0.02]"
                    >
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                                className="text-[10px] font-semibold text-white"
                                style={{ backgroundColor: a.color }}
                            >
                                {a.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-[#1A1A1A] dark:text-white">
                                <span className="font-semibold">{a.name}</span>{' '}
                                <span className="text-[#53565A] dark:text-[#B7C3D9]">
                                    {a.action}
                                </span>{' '}
                                <span className="font-medium">{a.target}</span>{' '}
                                <span className="text-[#86888C]">
                                    {a.detail}
                                </span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#86888C]">
                                {a.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
