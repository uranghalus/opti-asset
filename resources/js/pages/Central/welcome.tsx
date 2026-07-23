import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';

const features = [
    {
        title: 'Manajemen Data Aset',
        description:
            'Satu sumber data terpadu untuk seluruh aset perusahaan. Lacak detail, status, dan riwayat setiap item dari pengadaan hingga pemutihan.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
        ),
    },
    {
        title: 'Pemindaian Barcode',
        description:
            'Temukan data aset secara instan hanya dengan memindai barcode. Proses pencarian yang cepat dan akurat untuk ribuan aset.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>
        ),
    },
    {
        title: 'Transfer Aset',
        description:
            'Pindahkan aset antar departemen atau lokasi dengan alur persetujuan yang terstruktur dan tercatat secara otomatis.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        ),
    },
    {
        title: 'Disposal Aset',
        description:
            'Kelola proses disposisi aset dari pengajuan hingga persetujuan. Pantau status dan riwayat setiap aset yang didisposisi.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
        ),
    },
];

function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <button
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="flex size-9 items-center justify-center rounded-full border border-black/[0.06] bg-black/[0.03] text-[#53565A] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.06] hover:text-[#1A1A1A] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.08] dark:hover:text-white active:scale-[0.95]"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
            ) : (
                <svg className="size-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
            )}
        </button>
    );
}

export default function Welcome() {
    const { auth } = usePage().props as { auth?: { user?: { id: number; name: string; email: string; avatar?: string } } };

    return (
        <>
            <Head title="OptiAsset - Sistem Manajemen Aset" />

            <div className="relative min-h-[100dvh] overflow-hidden bg-[#FDFDFC] dark:bg-[#000C3D]">
                {/* Noise overlay — fixed, pointer-events-none */}
                <div
                    className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] dark:opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Background grid pattern — light mode */}
                <div
                    className="pointer-events-none absolute inset-0 dark:hidden"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,111,207,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,111,207,0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '48px 48px',
                    }}
                />
                {/* Radial vignette for grid — light mode */}
                <div
                    className="pointer-events-none absolute inset-0 dark:hidden"
                    style={{
                        background: 'radial-gradient(ellipse 65% 45% at 50% 40%, transparent 0%, #FDFDFC 70%)',
                    }}
                />

                {/* Ambient gradient orbs — vivid multi-color */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {/* Blue — top right, larger */}
                    <div className="absolute -top-[10%] right-[0%] h-[550px] w-[550px] rounded-full bg-[#006FCF]/[0.12] blur-[130px] dark:bg-[#006FCF]/[0.15]" />
                    {/* Navy — bottom left */}
                    <div className="absolute -bottom-[15%] -left-[3%] h-[420px] w-[420px] rounded-full bg-[#00175A]/[0.1] blur-[110px] dark:bg-[#00175A]/[0.18]" />
                    {/* Gold — center right, brighter */}
                    <div className="absolute top-[25%] right-[15%] h-[320px] w-[320px] rounded-full bg-[#BF9B30]/[0.1] blur-[100px] dark:bg-[#BF9B30]/[0.1]" />
                    {/* Emerald — bottom center, brighter */}
                    <div className="absolute -bottom-[8%] left-[30%] h-[350px] w-[350px] rounded-full bg-[#00875A]/[0.09] blur-[110px] dark:bg-[#00875A]/[0.1]" />
                    {/* Teal — top left, brighter */}
                    <div className="absolute top-[8%] -left-[5%] h-[300px] w-[300px] rounded-full bg-[#0891B2]/[0.09] blur-[100px] dark:bg-[#0891B2]/[0.09]" />
                    {/* Rose — left center, brighter */}
                    <div className="absolute top-[40%] left-[8%] h-[240px] w-[240px] rounded-full bg-[#E11D48]/[0.06] blur-[90px] dark:bg-[#E11D48]/[0.06]" />
                    {/* Violet — top center, new */}
                    <div className="absolute top-[5%] left-[40%] h-[200px] w-[200px] rounded-full bg-[#7C3AED]/[0.06] blur-[80px] dark:bg-[#7C3AED]/[0.06]" />
                    {/* Amber — bottom right, new */}
                    <div className="absolute bottom-[15%] right-[10%] h-[180px] w-[180px] rounded-full bg-[#F59E0B]/[0.06] blur-[70px] dark:bg-[#F59E0B]/[0.05]" />
                </div>

                {/* Decorative floating shapes — light mode */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
                    {/* Glass rings — varied sizes and colors */}
                    <div className="absolute top-[8%] right-[10%] size-[180px] rounded-full border-2 border-[#006FCF]/[0.08] bg-[#006FCF]/[0.02]" />
                    <div className="absolute top-[25%] left-[5%] size-[120px] rounded-full border-2 border-[#00875A]/[0.08] bg-[#00875A]/[0.02]" />
                    <div className="absolute bottom-[22%] right-[18%] size-[100px] rounded-full border-2 border-[#BF9B30]/[0.09] bg-[#BF9B30]/[0.02]" />
                    <div className="absolute top-[45%] left-[18%] size-[80px] rounded-full border-2 border-[#E11D48]/[0.07] bg-[#E11D48]/[0.015]" />
                    <div className="absolute top-[15%] left-[35%] size-[60px] rounded-full border-2 border-[#7C3AED]/[0.08] bg-[#7C3AED]/[0.015]" />

                    {/* Rounded rectangles — rotated */}
                    <div className="absolute top-[15%] left-[20%] h-[80px] w-[140px] rounded-2xl border-2 border-[#0891B2]/[0.07] bg-[#0891B2]/[0.02] -rotate-6" />
                    <div className="absolute bottom-[28%] left-[12%] h-[60px] w-[100px] rounded-xl border-2 border-[#E11D48]/[0.06] bg-[#E11D48]/[0.02] rotate-3" />
                    <div className="absolute top-[35%] right-[8%] h-[50px] w-[80px] rounded-xl border-2 border-[#F59E0B]/[0.07] bg-[#F59E0B]/[0.015] -rotate-3" />

                    {/* Dot clusters — more dots, more color */}
                    <div className="absolute top-[20%] right-[25%] flex gap-3">
                        <div className="size-2.5 rounded-full bg-[#006FCF]/[0.2]" />
                        <div className="mt-4 size-2 rounded-full bg-[#BF9B30]/[0.25]" />
                        <div className="mt-1 size-1.5 rounded-full bg-[#00875A]/[0.2]" />
                    </div>
                    <div className="absolute bottom-[32%] left-[28%] flex gap-2.5">
                        <div className="size-2 rounded-full bg-[#0891B2]/[0.2]" />
                        <div className="mt-2 size-1.5 rounded-full bg-[#E11D48]/[0.18]" />
                        <div className="mt-0.5 size-2 rounded-full bg-[#7C3AED]/[0.15]" />
                    </div>
                    <div className="absolute top-[55%] right-[30%] flex gap-2">
                        <div className="size-1.5 rounded-full bg-[#F59E0B]/[0.2]" />
                        <div className="mt-1 size-2 rounded-full bg-[#006FCF]/[0.15]" />
                    </div>

                    {/* Diagonal lines — varied colors */}
                    <div className="absolute top-[35%] left-[15%] h-px w-[200px] -rotate-[22deg] bg-gradient-to-r from-transparent via-[#006FCF]/[0.12] to-transparent" />
                    <div className="absolute top-[50%] right-[10%] h-px w-[160px] rotate-[18deg] bg-gradient-to-r from-transparent via-[#00875A]/[0.1] to-transparent" />
                    <div className="absolute top-[62%] left-[38%] h-px w-[140px] -rotate-[10deg] bg-gradient-to-r from-transparent via-[#BF9B30]/[0.1] to-transparent" />
                    <div className="absolute top-[28%] right-[35%] h-px w-[120px] rotate-[25deg] bg-gradient-to-r from-transparent via-[#E11D48]/[0.08] to-transparent" />
                </div>

                {/* Decorative floating shapes — dark mode */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
                    <div className="absolute top-[10%] right-[12%] size-[160px] rounded-full border border-[#006FCF]/[0.1] bg-[#006FCF]/[0.02]" />
                    <div className="absolute top-[30%] left-[6%] size-[120px] rounded-full border border-[#00875A]/[0.08] bg-[#00875A]/[0.02]" />
                    <div className="absolute bottom-[25%] right-[18%] size-[90px] rounded-full border border-[#BF9B30]/[0.08] bg-[#BF9B30]/[0.015]" />
                    <div className="absolute top-[18%] left-[30%] size-[70px] rounded-full border border-[#7C3AED]/[0.08] bg-[#7C3AED]/[0.015]" />

                    <div className="absolute top-[22%] left-[22%] h-[70px] w-[120px] rounded-2xl border border-[#0891B2]/[0.06] bg-[#0891B2]/[0.01] -rotate-6" />
                    <div className="absolute bottom-[30%] right-[12%] h-[50px] w-[90px] rounded-xl border border-[#E11D48]/[0.05] bg-[#E11D48]/[0.01] rotate-3" />

                    <div className="absolute top-[16%] right-[28%] flex gap-3">
                        <div className="size-2 rounded-full bg-[#006FCF]/35" />
                        <div className="mt-3 size-1.5 rounded-full bg-[#BF9B30]/30" />
                        <div className="size-2 rounded-full bg-[#00875A]/25" />
                    </div>
                    <div className="absolute bottom-[38%] left-[25%] flex gap-2">
                        <div className="size-1.5 rounded-full bg-[#0891B2]/25" />
                        <div className="mt-1 size-2 rounded-full bg-[#E11D48]/20" />
                    </div>

                    <div className="absolute top-[40%] left-[10%] h-px w-[180px] -rotate-[18deg] bg-gradient-to-r from-transparent via-[#006FCF]/[0.08] to-transparent" />
                    <div className="absolute top-[55%] right-[15%] h-px w-[140px] rotate-[12deg] bg-gradient-to-r from-transparent via-[#BF9B30]/[0.07] to-transparent" />
                </div>

                {/* Floating nav pill */}
                <header className="relative z-10 flex justify-center pt-6 md:pt-10">
                    <nav className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-2 py-2 shadow-[0_1px_3px_rgba(0,23,90,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center gap-2.5 pr-2 pl-4">
                            <AppLogoIcon className="size-7 text-[#006FCF]" />
                            <span className="text-sm font-semibold tracking-tight text-[#1A1A1A] dark:text-white">
                                OptiAsset
                            </span>
                        </div>
                        <div className="h-4 w-px bg-black/[0.06] dark:bg-white/10" />
                        {auth?.user ? (
                            <Link
                                href="/dashboard"
                                className="group flex items-center gap-2 rounded-full bg-[#00175A] px-5 py-2 text-sm font-medium text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#000C3D] dark:bg-[#006FCF] dark:hover:bg-[#1374D4] active:scale-[0.98]"
                            >
                                Dashboard
                                <span className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:bg-white/20">
                                    <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                            </Link>
                        ) : (
                            <a
                                href="/auth/redirect"
                                className="group flex items-center gap-2 rounded-full bg-[#00175A] px-5 py-2 text-sm font-medium text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#000C3D] dark:bg-[#006FCF] dark:hover:bg-[#1374D4] active:scale-[0.98]"
                            >
                                Masuk
                                <span className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:bg-white/20">
                                    <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                            </a>
                        )}
                        <ThemeToggle />
                    </nav>
                </header>

                {/* Hero — Centered Low */}
                <main className="relative z-10 mx-auto max-w-7xl px-4 pt-24 md:px-8">
                    <section className="flex min-h-[60vh] flex-col items-center justify-end pb-20 text-center md:pb-32">
                        <h1
                            className="mb-8 max-w-4xl text-5xl leading-[1.05] font-semibold tracking-[-0.03em] text-[#1A1A1A] opacity-0 dark:text-white md:text-6xl lg:text-[4.5rem]"
                            style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 200ms forwards' }}
                        >
                            Your Assets,{' '}
                            <span className="bg-gradient-to-r from-[#006FCF] to-[#00175A] bg-clip-text text-transparent dark:from-[#006FCF] dark:to-[#BF9B30]">
                                Managed.
                            </span>
                        </h1>

                        <p
                            className="mb-12 max-w-lg text-lg leading-relaxed text-[#53565A] opacity-0 dark:text-[#B7C3D9]"
                            style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 350ms forwards' }}
                        >
                            Satu sumber data terpadu untuk melacak dan mengoptimalkan seluruh aset perusahaan.
                        </p>

                        <div
                            className="flex flex-col gap-4 opacity-0 sm:flex-row sm:items-center"
                            style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 500ms forwards' }}
                        >
                            <a
                                href="/auth/redirect"
                                className="group inline-flex items-center gap-0 rounded-full bg-[#006FCF] py-2 pr-2 pl-7 text-sm font-medium text-white shadow-[0_0_24px_rgba(0,111,207,0.25)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1374D4] hover:shadow-[0_0_40px_rgba(0,111,207,0.35)] active:scale-[0.97]"
                            >
                                Mulai Sekarang
                                <span className="ml-2 flex size-9 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-110 group-hover:bg-white/20">
                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                            </a>
                        </div>
                    </section>

                    {/* Stats Bar — Double-Bezel */}
                    <section
                        className="mx-auto max-w-3xl opacity-0"
                        style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 650ms forwards' }}
                    >
                        <div className="rounded-[1.5rem] border border-black/[0.06] bg-black/[0.02] p-[3px] dark:border-white/[0.06] dark:bg-white/[0.03]">
                            <div className="rounded-[calc(1.5rem-3px)] bg-white px-8 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,23,90,0.06)] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="flex items-center justify-between">
                                    <div className="text-center">
                                        <div className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white md:text-3xl">2.847</div>
                                        <div className="mt-1 text-xs text-[#86888C] dark:text-white/40">Total Aset</div>
                                    </div>
                                    <div className="h-10 w-px bg-[#D5D9DC] dark:bg-white/[0.08]" />
                                    <div className="text-center">
                                        <div className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white md:text-3xl">Real-time</div>
                                        <div className="mt-1 text-xs text-[#86888C] dark:text-white/40">Pembaruan Data</div>
                                    </div>
                                    <div className="h-10 w-px bg-[#D5D9DC] dark:bg-white/[0.08]" />
                                    <div className="text-center">
                                        <div className="text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white md:text-3xl">100%</div>
                                        <div className="mt-1 text-xs text-[#86888C] dark:text-white/40">Visibilitas Aset</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features — Asymmetric Bento with Double-Bezel */}
                    <section className="mt-32 md:mt-40">
                        <div
                            className="mb-16 max-w-2xl opacity-0"
                            style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 200ms forwards' }}
                        >
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#006FCF]/20 bg-[#006FCF]/[0.06] px-4 py-1.5">
                                <span className="text-[10px] font-medium tracking-[0.2em] text-[#006FCF] uppercase">
                                    Fitur Utama
                                </span>
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white md:text-4xl">
                                Semua yang Anda butuhkan untuk mengelola aset perusahaan.
                            </h2>
                        </div>

                        {/* Bento grid — asymmetric */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Data Management — spans full height left */}
                            <div
                                className="opacity-0 md:row-span-2"
                                style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 300ms forwards' }}
                            >
                                <div className="group h-full rounded-[1.5rem] border border-black/[0.06] bg-black/[0.02] p-[3px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#006FCF]/20 hover:shadow-[0_8px_40px_rgba(0,111,207,0.08)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:shadow-[0_8px_40px_rgba(0,111,207,0.1)]">
                                    <div className="flex h-full flex-col rounded-[calc(1.5rem-3px)] bg-white p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,23,90,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-10">
                                        <div className="mb-8 h-1 w-14 rounded-full bg-gradient-to-r from-[#006FCF] to-[#1374D4]" />
                                        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#006FCF]/[0.08] text-[#006FCF] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:bg-[#006FCF] group-hover:text-white dark:bg-[#006FCF]/10">
                                            {features[0].icon}
                                        </div>
                                        <h3 className="mb-3 text-xl font-semibold text-[#1A1A1A] dark:text-white">{features[0].title}</h3>
                                        <p className="mb-10 max-w-sm text-sm leading-relaxed text-[#53565A] dark:text-[#B7C3D9]">{features[0].description}</p>

                                        {/* Asset data preview — nested bezel */}
                                        <div className="mt-auto">
                                            <div className="rounded-[1.25rem] border border-black/[0.04] bg-[#F7F8F9] p-[2px] dark:border-white/[0.06] dark:bg-white/[0.03]">
                                                <div className="rounded-[calc(1.25rem-2px)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className="text-xs font-medium text-[#86888C] dark:text-white/50">Contoh Data Aset</span>
                                                        <span className="rounded-full bg-[#00875A]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#00875A]">Aktif</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {[
                                                            { name: 'Laptop Dell XPS 15', loc: 'Lantai 3, IT', cat: 'Elektronik' },
                                                            { name: 'Printer HP LaserJet', loc: 'Lantai 2, Admin', cat: 'Peripheral' },
                                                            { name: 'Meja Kerja Ergonomis', loc: 'Lantai 1, HR', cat: 'Furniture' },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between rounded-xl border border-[#ECEDEE] bg-[#F7F8F9] px-3.5 py-3 dark:border-white/[0.04] dark:bg-white/[0.02]">
                                                                <div>
                                                                    <div className="text-xs font-medium text-[#1A1A1A] dark:text-white">{item.name}</div>
                                                                    <div className="mt-0.5 text-[10px] text-[#86888C] dark:text-white/40">{item.loc}</div>
                                                                </div>
                                                                <span className="rounded-full bg-[#ECEDEE] px-2.5 py-0.5 text-[10px] text-[#53565A] dark:bg-white/[0.06] dark:text-white/50">{item.cat}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Barcode Scanning — right top */}
                            <div
                                className="opacity-0"
                                style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 420ms forwards' }}
                            >
                                <div className="group rounded-[1.5rem] border border-black/[0.06] bg-black/[0.02] p-[3px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#006FCF]/20 hover:shadow-[0_8px_40px_rgba(0,111,207,0.08)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:shadow-[0_8px_40px_rgba(0,111,207,0.1)]">
                                    <div className="rounded-[calc(1.5rem-3px)] bg-white p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,23,90,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                        <div className="mb-6 h-1 w-14 rounded-full bg-[#006FCF]" />
                                        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#006FCF]/[0.08] text-[#006FCF] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:bg-[#006FCF] group-hover:text-white dark:bg-[#006FCF]/10">
                                            {features[1].icon}
                                        </div>
                                        <h3 className="mb-2 text-xl font-semibold text-[#1A1A1A] dark:text-white">{features[1].title}</h3>
                                        <p className="max-w-sm text-sm leading-relaxed text-[#53565A] dark:text-[#B7C3D9]">{features[1].description}</p>

                                        {/* Barcode mock — nested bezel */}
                                        <div className="mt-8">
                                            <div className="rounded-[1.25rem] border border-black/[0.04] bg-[#F7F8F9] p-[2px] dark:border-white/[0.06] dark:bg-white/[0.03]">
                                                <div className="rounded-[calc(1.25rem-2px)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-[#00875A]">
                                                            <div className="size-2 animate-ping rounded-full bg-[#00875A]/40" />
                                                        </div>
                                                        <span className="text-[11px] font-medium text-[#86888C] dark:text-white/50">Scanner Aktif</span>
                                                    </div>
                                                    <div className="flex gap-[3px]">
                                                        {[3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1].map((w, i) => (
                                                            <div
                                                                key={i}
                                                                className="bg-[#1A1A1A] dark:bg-white/60"
                                                                style={{
                                                                    width: `${w}px`,
                                                                    height: '32px',
                                                                    animation: `barGrow 400ms cubic-bezier(0.32,0.72,0,1) ${800 + i * 20}ms forwards`,
                                                                    transformOrigin: 'bottom',
                                                                    transform: 'scaleY(0)',
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 rounded-xl border border-[#ECEDEE] bg-[#F7F8F9] px-3.5 py-2.5 text-center text-[11px] font-medium text-[#53565A] dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-white/60">
                                                        AST-2024-0847
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transfer + Disposal — right bottom */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Transfer */}
                                <div
                                    className="opacity-0"
                                    style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 540ms forwards' }}
                                >
                                    <div className="group rounded-[1.5rem] border border-black/[0.06] bg-black/[0.02] p-[3px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#006FCF]/20 hover:shadow-[0_8px_40px_rgba(0,111,207,0.06)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:shadow-[0_8px_40px_rgba(0,111,207,0.08)]">
                                        <div className="rounded-[calc(1.5rem-3px)] bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,23,90,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                            <div className="mb-5 h-1 w-10 rounded-full bg-[#00175A] dark:bg-[#006FCF]" />
                                            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#00175A]/[0.06] text-[#00175A] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:bg-[#00175A] group-hover:text-white dark:bg-[#006FCF]/10 dark:text-[#006FCF] dark:group-hover:bg-[#006FCF]">
                                                {features[2].icon}
                                            </div>
                                            <h3 className="mb-2 text-base font-semibold text-[#1A1A1A] dark:text-white">{features[2].title}</h3>
                                            <p className="text-xs leading-relaxed text-[#53565A] dark:text-[#B7C3D9]">{features[2].description}</p>

                                            {/* Transfer flow mock */}
                                            <div className="mt-5 flex items-center gap-2.5">
                                                <div className="flex-1 rounded-xl border border-[#ECEDEE] bg-[#F7F8F9] p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                                    <div className="text-[9px] text-[#86888C] dark:text-white/40">Dari</div>
                                                    <div className="mt-0.5 text-[11px] font-medium text-[#1A1A1A] dark:text-white/80">IT Dept</div>
                                                </div>
                                                <svg className="size-3.5 shrink-0 text-[#006FCF]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                                <div className="flex-1 rounded-xl border border-[#ECEDEE] bg-[#F7F8F9] p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                                    <div className="text-[9px] text-[#86888C] dark:text-white/40">Ke</div>
                                                    <div className="mt-0.5 text-[11px] font-medium text-[#1A1A1A] dark:text-white/80">HR Dept</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Disposal */}
                                <div
                                    className="opacity-0"
                                    style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 660ms forwards' }}
                                >
                                    <div className="group rounded-[1.5rem] border border-black/[0.06] bg-black/[0.02] p-[3px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#B95000]/20 hover:shadow-[0_8px_40px_rgba(185,80,0,0.06)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-[#B95000]/30 dark:hover:bg-white/[0.05] dark:hover:shadow-[0_8px_40px_rgba(185,80,0,0.08)]">
                                        <div className="rounded-[calc(1.5rem-3px)] bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,23,90,0.06)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                            <div className="mb-5 h-1 w-10 rounded-full bg-[#B95000]" />
                                            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#B95000]/[0.08] text-[#B95000] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:bg-[#B95000] group-hover:text-white dark:bg-[#B95000]/10">
                                                {features[3].icon}
                                            </div>
                                            <h3 className="mb-2 text-base font-semibold text-[#1A1A1A] dark:text-white">{features[3].title}</h3>
                                            <p className="text-xs leading-relaxed text-[#53565A] dark:text-[#B7C3D9]">{features[3].description}</p>

                                            <div className="mt-5 rounded-xl border border-[#B95000]/20 bg-[#B95000]/[0.06] p-2.5 text-center dark:bg-[#B95000]/[0.08]">
                                                <span className="text-[11px] font-medium text-[#B95000]">12 Menunggu</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section — Double-Bezel */}
                    <section className="mt-32 md:mt-40">
                        <div
                            className="opacity-0"
                            style={{ animation: 'fadeUp 800ms cubic-bezier(0.32,0.72,0,1) 200ms forwards' }}
                        >
                            <div className="rounded-[2rem] border border-[#00175A]/20 bg-[#00175A]/[0.03] p-[3px] dark:border-white/[0.06] dark:bg-white/[0.03]">
                                <div className="relative overflow-hidden rounded-[calc(2rem-3px)] bg-[#00175A] px-8 py-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:px-16 md:py-24 dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    {/* Decorative gradients inside CTA */}
                                    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#006FCF]/20 blur-[100px] dark:bg-[#006FCF]/[0.1]" />
                                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#BF9B30]/10 blur-[80px] dark:bg-[#BF9B30]/[0.06]" />

                                    <div className="relative flex flex-col items-center text-center">
                                        <h2 className="mb-5 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
                                            Optimalkan pengelolaan aset Anda hari ini.
                                        </h2>
                                        <p className="mb-10 max-w-md text-base leading-relaxed text-[#B7C3D9]">
                                            Masuk menggunakan akun SSO perusahaan Anda dan mulai
                                            mengelola seluruh aset dalam hitungan menit.
                                        </p>
                                        <a
                                            href="/auth/redirect"
                                            className="group inline-flex items-center gap-0 rounded-full bg-white py-2 pr-2 pl-8 text-sm font-medium text-[#00175A] shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/90 hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] active:scale-[0.97]"
                                        >
                                            Masuk dengan SSO
                                            <span className="ml-2 flex size-9 items-center justify-center rounded-full bg-[#00175A]/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-110 group-hover:bg-[#00175A]/10">
                                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-[#D5D9DC] py-10 dark:border-white/[0.06]">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="size-5 text-[#86888C] dark:text-white/30" />
                            <span className="text-xs text-[#86888C] dark:text-white/30">OptiAsset</span>
                        </div>
                        <span className="text-xs text-[#86888C] dark:text-white/30">Sistem Manajemen Aset Internal</span>
                    </div>
                </footer>
            </div>

            {/* CSS Keyframes */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes fadeUp {
                            from {
                                opacity: 0;
                                transform: translateY(1.5rem) blur(4px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) blur(0);
                            }
                        }
                        @keyframes barGrow {
                            from {
                                transform: scaleY(0);
                            }
                            to {
                                transform: scaleY(1);
                            }
                        }
                        @media (prefers-reduced-motion: reduce) {
                            [style*="animation"] {
                                animation: none !important;
                                opacity: 1 !important;
                                transform: none !important;
                            }
                        }
                    `,
                }}
            />
        </>
    );
}
