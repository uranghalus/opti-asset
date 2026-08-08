import { ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type User = {
    id: number;
    name: string;
    email: string;
    created_at: string;
};

const COLORS = ['#006FCF', '#00875A', '#BF9B30', '#7C3AED', '#B95000'];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) {
        return 'baru saja';
    }

    if (diffMin < 60) {
        return `${diffMin}m lalu`;
    }

    const diffHour = Math.floor(diffMin / 60);

    if (diffHour < 24) {
        return `${diffHour}j lalu`;
    }

    const diffDay = Math.floor(diffHour / 24);

    return `${diffDay}h lalu`;
}

export function ActivityFeed({ users }: { users: User[] }) {
    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#00875A] uppercase">
                        Aktivitas
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Pengguna Terbaru
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
                {users.length === 0 && (
                    <p className="py-4 text-center text-sm text-[#86888C]">
                        Belum ada pengguna.
                    </p>
                )}
                {users.map((user, i) => (
                    <div
                        key={user.id}
                        className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[#F7F8F9]/50 dark:hover:bg-white/[0.02]"
                    >
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                                className="text-[10px] font-semibold text-white"
                                style={{
                                    backgroundColor: COLORS[i % COLORS.length],
                                }}
                            >
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-[#1A1A1A] dark:text-white">
                                <span className="font-semibold">
                                    {user.name}
                                </span>{' '}
                                <span className="text-[#53565A] dark:text-[#B7C3D9]">
                                    bergabung
                                </span>
                            </p>
                            <p className="text-[11px] text-[#86888C]">
                                {user.email}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#86888C]">
                                {timeAgo(user.created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
