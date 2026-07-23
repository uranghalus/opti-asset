import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const events = [
    {
        day: '24',
        weekday: 'JUL',
        time: '09:00',
        title: 'Audit Aset Gedung A',
        attendees: ['AP', 'SD'],
        colors: ['#006FCF', '#00875A'],
    },
    {
        day: '25',
        weekday: 'JUL',
        time: '14:00',
        title: 'Rapat Pemeliharaan IT',
        attendees: ['BS', 'MP', 'RD'],
        colors: ['#BF9B30', '#B95000', '#7C3AED'],
    },
    {
        day: '28',
        weekday: 'JUL',
        time: '10:30',
        title: 'Penerimaan Laptop Baru',
        attendees: ['AP'],
        colors: ['#006FCF'],
    },
];

export function UpcomingEvents() {
    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B95000]">
                        Jadwal
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Mendatang
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
            <div className="flex flex-col gap-3">
                {events.map((e, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[#F7F8F9]/50 dark:hover:bg-white/[0.02]"
                    >
                        <div className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#F7F8F9] dark:bg-white/[0.04]">
                            <span className="text-[10px] font-bold uppercase text-[#006FCF]">{e.weekday}</span>
                            <span className="text-lg font-bold leading-none text-[#1A1A1A] dark:text-white">{e.day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">{e.title}</p>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] text-[#86888C]">{e.time}</span>
                                <span className="text-[#D5D9DC] dark:text-[#1e293b]">·</span>
                                <div className="flex -space-x-1.5">
                                    {e.attendees.map((initials, j) => (
                                        <Avatar key={j} className="h-5 w-5 border-2 border-white dark:border-[#0f172a]">
                                            <AvatarFallback
                                                className="text-[8px] font-bold text-white"
                                                style={{ backgroundColor: e.colors[j] }}
                                            >
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                                {e.attendees.length > 2 && (
                                    <span className="text-[10px] text-[#86888C]">
                                        +{e.attendees.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
