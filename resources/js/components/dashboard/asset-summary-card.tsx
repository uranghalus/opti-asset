import { useReveal } from '@/hooks/use-reveal';

export function AssetSummaryCard() {
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal delay-300">
            <div className="overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#00175A] to-[#000C3D] p-[1px]">
                <div className="rounded-[calc(1.25rem-1px)] bg-gradient-to-br from-[#00175A]/90 to-[#000C3D]/90 p-6 text-white">
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">
                        Portfolio
                    </p>
                    <p className="mb-4 text-sm font-medium text-white/70">
                        Total Asset Value
                    </p>
                    <p className="mb-1 text-3xl font-bold tracking-tight">
                        Rp 12.4B
                    </p>
                    <p className="mb-6 text-xs text-[#00875A]">
                        +Rp 850M this quarter
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.06] p-3">
                            <p className="text-[10px] text-white/40">Active</p>
                            <p className="mt-0.5 text-lg font-bold">1,089</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.06] p-3">
                            <p className="text-[10px] text-white/40">
                                Maintenance
                            </p>
                            <p className="mt-0.5 text-lg font-bold">67</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
