import { usePage } from '@inertiajs/react';
import { useReveal } from '@/hooks/use-reveal';

export function WelcomeBanner() {
    const { auth } = usePage().props;
    const name = auth?.user?.name?.split(' ')[0] ?? 'User';
    const ref = useReveal();

    return (
        <div ref={ref} className="reveal bezel-outer">
            <div className="relative overflow-hidden rounded-[calc(1.25rem-0.375rem)] bg-gradient-to-br from-[#006FCF] via-[#00509E] to-[#00175A] p-8 text-white">
                <div className="relative z-10">
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                        Dashboard
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                        Good morning, {name}
                    </h1>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
                        Here's what's happening with your asset portfolio today.
                        You have{' '}
                        <span className="font-semibold text-white">
                            8 pending
                        </span>{' '}
                        requests awaiting approval.
                    </p>
                </div>

                {/* Decorative orbs */}
                <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-white/[0.04] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-[#BF9B30]/[0.06] blur-2xl" />

                {/* Grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>
        </div>
    );
}
