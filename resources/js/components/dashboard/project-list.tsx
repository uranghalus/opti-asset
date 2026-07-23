import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const projects = [
    {
        name: 'Pengadaan Laptop 2026',
        type: 'Pengadaan',
        progress: 75,
        color: '#006FCF',
    },
    {
        name: 'Migrasi Server',
        type: 'Infrastruktur',
        progress: 60,
        color: '#00875A',
    },
    {
        name: 'Renovasi Kantor',
        type: 'Fasilitas',
        progress: 90,
        color: '#BF9B30',
    },
    { name: 'Upgrade Jaringan', type: 'IT', progress: 40, color: '#B95000' },
];

export function ProjectList() {
    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#006FCF] uppercase">
                        Proyek
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Daftar Proyek
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
                {projects.map((p) => (
                    <div
                        key={p.name}
                        className="rounded-lg border border-[#ECEDEE] p-3 transition-colors hover:bg-[#F7F8F9]/50 dark:border-[#1e293b] dark:hover:bg-white/[0.02]"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                                    {p.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#86888C]">
                                    {p.type}
                                </p>
                            </div>
                            <span
                                className="text-xs font-semibold tabular-nums"
                                style={{ color: p.color }}
                            >
                                {p.progress}%
                            </span>
                        </div>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#ECEDEE] dark:bg-white/[0.06]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${p.progress}%`,
                                    backgroundColor: p.color,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
