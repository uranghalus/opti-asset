import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Department = {
    id_department: string;
    kode_department: string;
    nama_department: string;
    created_at: string;
};

const COLORS = ['#006FCF', '#00875A', '#BF9B30', '#B95000', '#7C3AED'];

export function ProjectList({ departments }: { departments: Department[] }) {
    return (
        <div className="rounded-2xl border border-[#D5D9DC] bg-white p-5 dark:border-[#1e293b] dark:bg-[#0f172a]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-[#006FCF] uppercase">
                        Departemen
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#1A1A1A] dark:text-white">
                        Daftar Departemen
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
                {departments.length === 0 && (
                    <p className="py-4 text-center text-sm text-[#86888C]">
                        Belum ada departemen.
                    </p>
                )}
                {departments.map((dept, i) => (
                    <div
                        key={dept.id_department}
                        className="rounded-lg border border-[#ECEDEE] p-3 transition-colors hover:bg-[#F7F8F9]/50 dark:border-[#1e293b] dark:hover:bg-white/[0.02]"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                                    {dept.nama_department}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#86888C]">
                                    {dept.kode_department}
                                </p>
                            </div>
                            <span
                                className="size-2 rounded-full"
                                style={{
                                    backgroundColor: COLORS[i % COLORS.length],
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
