/* eslint-disable react-hooks/set-state-in-effect */
import { Head, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    History,
    Menu,
    Moon,
    ShieldCheck,
    Sun,
    X,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LazySection } from '@/components/lazy-section';
import { useAppearance } from '@/hooks/use-appearance';

const ScannerDeck = lazy(() =>
    import('@/pages/welcome-sections').then((m) => ({
        default: m.ScannerDeck,
    })),
);

const FeaturesSection = lazy(() =>
    import('@/pages/welcome-sections').then((m) => ({
        default: m.FeaturesSection,
    })),
);

const HierarchySection = lazy(() =>
    import('@/pages/welcome-sections').then((m) => ({
        default: m.HierarchySection,
    })),
);

const StepsSection = lazy(() =>
    import('@/pages/welcome-sections').then((m) => ({
        default: m.StepsSection,
    })),
);

const CTASection = lazy(() =>
    import('@/pages/welcome-sections').then((m) => ({
        default: m.CTASection,
    })),
);

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const BLUE = '#0080FF';
const IRIS = '#6971ec';
const TEAL = '#20B2AA';
const PINK = '#EC4B9E';

const WORDS = [
    { word: 'Lacak', color: BLUE },
    { word: 'Pindai', color: TEAL },
    { word: 'Kelola', color: IRIS },
    { word: 'Audit', color: PINK },
];

const STATS = [
    {
        value: 12480,
        decimals: 0,
        suffix: '',
        label: 'Aset terlacak',
        note: '+328 bulan ini',
        color: BLUE,
    },
    {
        value: 4,
        decimals: 0,
        suffix: ' level',
        label: 'Klasifikasi hirarki',
        note: 'GOL · KAT · CLU · SUB',
        color: IRIS,
    },
    {
        value: 99.2,
        decimals: 1,
        suffix: '%',
        label: 'Akurasi pencatatan',
        note: 'audit kuartal terakhir',
        color: TEAL,
    },
    {
        value: 0.4,
        decimals: 1,
        suffix: ' dtk',
        label: 'Respons pemindaian',
        note: 'rata-rata lapangan',
        color: PINK,
    },
];

const scanLog = [
    {
        id: 'AST-2024-0847',
        name: 'Laptop Dell Latitude 5440',
        loc: 'Lantai 3 · IT',
    },
    {
        id: 'AST-2024-0851',
        name: 'Printer HP LaserJet Pro',
        loc: 'Lantai 2 · Admin',
    },
    {
        id: 'AST-2023-1120',
        name: 'Meja Kerja Ergonomis',
        loc: 'Lantai 1 · HR',
    },
];

const SCRAMBLE_CHARS = 'ACDEHKMNPRTUX0123456789#/';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Reveal({
    children,
    className = '',
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        el.classList.add('is-in');
                        io.unobserve(el);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );
        io.observe(el);

        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`reveal ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

function Eyebrow({ label, color = BLUE }: { label: string; color?: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span
                className="pulse-dot size-1.5 rounded-full"
                style={{ background: color }}
            />
            {label}
        </span>
    );
}

function ScrambleWord({ words }: { words: { word: string; color: string }[] }) {
    const [text, setText] = useState(words[0].word);
    const [idx, setIdx] = useState(0);
    const idxRef = useRef(0);

    useEffect(() => {
        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        let alive = true;
        let stepTimer = 0;

        const scrambleTo = (target: string) => {
            if (reduce) {
                setText(target);

                return;
            }

            let n = 0;
            const total = Math.max(12, target.length * 4);

            const run = () => {
                if (!alive) {
                    return;
                }

                n += 1;
                const solved = Math.floor((n / total) * target.length);
                let out = '';

                for (let i = 0; i < target.length; i += 1) {
                    out +=
                        i < solved
                            ? target[i]
                            : SCRAMBLE_CHARS[
                                  Math.floor(
                                      Math.random() * SCRAMBLE_CHARS.length,
                                  )
                              ];
                }

                if (n >= total) {
                    setText(target);
                } else {
                    setText(out);
                    stepTimer = window.setTimeout(run, 34);
                }
            };
            run();
        };

        const cycle = window.setInterval(() => {
            idxRef.current = (idxRef.current + 1) % words.length;
            setIdx(idxRef.current);
            scrambleTo(words[idxRef.current].word);
        }, 2800);

        return () => {
            alive = false;
            window.clearInterval(cycle);
            window.clearTimeout(stepTimer);
        };
    }, [words]);

    return (
        <span className="relative inline-grid align-baseline">
            {words.map((w) => (
                <span
                    key={w.word}
                    className="invisible col-start-1 row-start-1"
                    aria-hidden
                >
                    {w.word}
                </span>
            ))}
            <span
                className="word-glow col-start-1 row-start-1 font-extrabold transition-colors duration-300"
                style={{ color: words[idx].color }}
            >
                {text}
            </span>
        </span>
    );
}

function useCountUp(target: number, decimals: number, duration = 1400) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const [val, setVal] = useState(0);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        let raf = 0;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVal(target);

            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) {
                    return;
                }

                io.disconnect();
                const t0 = performance.now();

                const loop = (t: number) => {
                    const p = Math.min(1, (t - t0) / duration);
                    const eased = 1 - Math.pow(1 - p, 3);
                    setVal(target * eased);

                    if (p < 1) {
                        raf = requestAnimationFrame(loop);
                    }
                };
                raf = requestAnimationFrame(loop);
            },
            { threshold: 0.4 },
        );
        io.observe(el);

        return () => {
            io.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [target, duration]);

    return {
        ref,
        text: val.toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }),
    };
}

function StatCell({
    value,
    decimals,
    suffix,
    label,
    note,
    color,
}: (typeof STATS)[number]) {
    const { ref, text } = useCountUp(value, decimals);

    return (
        <div className="bg-white/75 px-6 py-7 dark:bg-[#0b1322]/80">
            <div
                className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color }}
            >
                {label}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
                <span
                    ref={ref}
                    className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums md:text-4xl dark:text-white"
                >
                    {text}
                </span>
                <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
                    {suffix}
                </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {note}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const isDark =
        appearance === 'dark' ||
        (appearance === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <button
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="group flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-900/10 bg-white/60 text-slate-700 transition-all duration-200 hover:bg-white/90 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Ganti tema"
        >
            {isDark ? (
                <Sun className="size-[18px] transition-transform duration-300 group-hover:rotate-45" />
            ) : (
                <Moon className="size-[18px] transition-transform duration-300 group-hover:-rotate-12" />
            )}
        </button>
    );
}

function NavLink({ href, children }: { href: string; children: string }) {
    return (
        <a
            href={href}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
            {children}
        </a>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Welcome() {
    const { auth } = usePage().props as {
        auth?: {
            user?: { id: number; name: string; email: string; avatar?: string };
        };
    };
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const ctaHref = auth?.user ? '/dashboard' : '/auth/redirect';
    const ctaLabel = auth?.user ? 'Buka Dashboard' : 'Masuk via SSO';

    const navLinks: [string, string][] = [
        ['#fitur', 'Fitur'],
        ['#hirarki', 'Hirarki'],
        ['#cara-kerja', 'Cara Kerja'],
        ...(auth?.user
            ? ([['/organizations', 'Organisasi']] as [string, string][])
            : []),
    ];

    return (
        <>
            <Head title="OptiAsset - Sistem Manajemen Aset" />

            <div className="relative min-h-[100dvh] overflow-x-clip bg-[#F3F6FC] text-slate-900 dark:bg-[#070c18] dark:text-white">
                {/* Latar aurora + noise */}
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    aria-hidden
                >
                    <div className="blob-drift-a absolute -top-[18%] -left-[8%] h-[560px] w-[560px] rounded-full bg-[#0080FF]/20 blur-[130px] dark:bg-[#0080FF]/15" />
                    <div className="blob-drift-b absolute top-[14%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#6971ec]/20 blur-[140px] dark:bg-[#6971ec]/15" />
                    <div className="absolute bottom-[-14%] left-[26%] h-[480px] w-[480px] rounded-full bg-[#20B2AA]/15 blur-[130px] dark:bg-[#20B2AA]/10" />
                    <div className="absolute top-[42%] left-[-6%] h-[340px] w-[340px] rounded-full bg-[#EC4B9E]/10 blur-[120px]" />
                    <div className="dotgrid absolute inset-x-0 top-0 h-[70%] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-60" />
                    <div className="noise-layer" />
                </div>

                {/* Header */}
                <header className="sticky top-0 z-[100] px-4 transition-all duration-300 md:px-6">
                    <nav
                        className={`mx-auto mt-3 flex max-w-7xl items-center justify-between gap-6 rounded-xl border px-4 py-3 transition-all duration-300 ${
                            scrolled
                                ? 'border-white/60 bg-white/75 shadow-lg shadow-[#0B3D6B]/5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a1120]/80'
                                : 'border-transparent bg-transparent'
                        }`}
                    >
                        <a
                            href="#"
                            className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]"
                        >
                            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white shadow-md shadow-[#0080FF]/25">
                                <AppLogoIcon className="size-5" />
                            </span>
                            <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                                OptiAsset
                            </span>
                        </a>

                        <div className="hidden items-center gap-6 md:flex">
                            {navLinks.map(([href, label]) => (
                                <NavLink key={href} href={href}>
                                    {label}
                                </NavLink>
                            ))}
                        </div>

                        <div className="hidden items-center gap-3 md:flex">
                            <ThemeToggle />
                            <a
                                href={ctaHref}
                                className="group inline-flex items-center gap-2 rounded-lg bg-[#0080FF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#006fdd] focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:translate-y-0 active:scale-95"
                            >
                                {auth?.user ? 'Dashboard' : 'Masuk'}
                                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </a>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="flex size-10 items-center justify-center rounded-lg border border-slate-900/10 bg-white/60 text-slate-700 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                                aria-label="Buka menu"
                                aria-expanded={mobileOpen}
                            >
                                {mobileOpen ? (
                                    <X className="size-5" />
                                ) : (
                                    <Menu className="size-5" />
                                )}
                            </button>
                        </div>
                    </nav>

                    {mobileOpen && (
                        <div className="level-in mx-auto mt-2 max-w-7xl overflow-hidden rounded-xl border border-white/60 bg-white/90 shadow-xl md:hidden dark:border-white/10 dark:bg-[#0a1120]/95">
                            <div className="flex flex-col p-3">
                                {navLinks.map(([href, label]) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                                    >
                                        {label}
                                    </a>
                                ))}
                                <a
                                    href={ctaHref}
                                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0080FF] px-4 py-3 text-sm font-semibold text-white shadow-md active:scale-95"
                                >
                                    {ctaLabel}
                                </a>
                            </div>
                        </div>
                    )}
                </header>

                <main className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
                    {/* HERO */}
                    <section className="grid items-center gap-14 pt-12 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-20 lg:pb-24">
                        <div className="flex flex-col items-start">
                            <Reveal>
                                <Eyebrow label="SISTEM MANAJEMEN ASET INTERNAL" />
                            </Reveal>

                            <Reveal delay={80}>
                                <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.9rem]">
                                    <ScrambleWord words={WORDS} /> setiap aset.
                                    <br />
                                    <span className="font-bold text-slate-400 dark:text-slate-500">
                                        Kendali penuh sampai tuntas.
                                    </span>
                                </h1>
                            </Reveal>

                            <Reveal delay={160}>
                                <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                    OptiAsset menyatukan data, lokasi, dan
                                    riwayat seluruh aset organisasi dalam satu
                                    sumber kebenaran — tercatat otomatis sejak
                                    pengadaan hingga penghapusan.
                                </p>
                            </Reveal>

                            <Reveal delay={240}>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <a
                                        href={ctaHref}
                                        className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#0080FF] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#006fdd] focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:translate-y-0 active:scale-95"
                                    >
                                        {auth?.user
                                            ? 'Buka Dashboard'
                                            : 'Masuk via SSO'}
                                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </a>
                                    <a
                                        href="#fitur"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900/15 bg-white/50 px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                    >
                                        Jelajahi Fitur
                                    </a>
                                </div>
                            </Reveal>

                            <Reveal delay={320}>
                                <div className="mt-9 flex flex-wrap gap-2.5">
                                    {[
                                        {
                                            icon: ShieldCheck,
                                            label: 'SSO KORPORAT',
                                            color: BLUE,
                                        },
                                        {
                                            icon: Building2,
                                            label: 'MULTI-DEPARTEMEN',
                                            color: IRIS,
                                        },
                                        {
                                            icon: History,
                                            label: 'JEJAK AUDIT PENUH',
                                            color: TEAL,
                                        },
                                    ].map((chip) => {
                                        const ChipIcon = chip.icon;

                                        return (
                                            <span
                                                key={chip.label}
                                                className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/55 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.14em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                                            >
                                                <ChipIcon
                                                    className="size-3.5"
                                                    style={{
                                                        color: chip.color,
                                                    }}
                                                />
                                                {chip.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </Reveal>
                        </div>

                        <Reveal delay={200}>
                            <LazySection
                                fallback={
                                    <div className="mx-auto h-[440px] w-full max-w-[480px] animate-pulse rounded-2xl border border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/[0.04]" />
                                }
                            >
                                <Suspense
                                    fallback={
                                        <div className="mx-auto h-[440px] w-full max-w-[480px] animate-pulse rounded-2xl border border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/[0.04]" />
                                    }
                                >
                                    <ScannerDeck />
                                </Suspense>
                            </LazySection>
                        </Reveal>
                    </section>

                    {/* TICKER */}
                    <Reveal>
                        <div className="marquee-mask overflow-hidden rounded-xl border border-white/60 bg-white/45 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="marquee-track flex w-max items-center py-3 font-mono text-[11px] tracking-wider uppercase">
                                {[0, 1].map((dup) => (
                                    <div
                                        key={dup}
                                        className="flex items-center"
                                        aria-hidden={dup === 1}
                                    >
                                        {[...scanLog, ...scanLog].map(
                                            (row, ri) => (
                                                <span
                                                    key={`${dup}-${row.id}-${ri}`}
                                                    className="flex items-center gap-3 px-6"
                                                >
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {row.name}
                                                    </span>
                                                    <span className="text-[#0080FF]">
                                                        {row.id}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        ·
                                                    </span>
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        {row.loc}
                                                    </span>
                                                    <span className="pl-5 text-slate-300 dark:text-slate-700">
                                                        /
                                                    </span>
                                                </span>
                                            ),
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>

                    {/* STATISTIK */}
                    <Reveal delay={80}>
                        <div className="mt-6 overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-[0_10px_44px_-16px_rgba(15,35,80,0.18)] dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="grid grid-cols-2 gap-px bg-slate-900/10 lg:grid-cols-4 dark:bg-white/10">
                                {STATS.map((stat) => (
                                    <StatCell key={stat.label} {...stat} />
                                ))}
                            </div>
                        </div>
                    </Reveal>

                    {/* FITUR — lazy */}
                    <LazySection
                        className="section-gap scroll-mt-28"
                        fallback={<SectionSkeleton />}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <FeaturesSection />
                        </Suspense>
                    </LazySection>

                    {/* HIRARKI — lazy */}
                    <LazySection
                        className="section-gap scroll-mt-28 !pt-0"
                        fallback={<SectionSkeleton />}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <HierarchySection />
                        </Suspense>
                    </LazySection>

                    {/* CARA KERJA — lazy */}
                    <LazySection
                        className="section-gap scroll-mt-28 !pt-0"
                        fallback={<SectionSkeleton />}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <StepsSection />
                        </Suspense>
                    </LazySection>

                    {/* CTA — lazy */}
                    <LazySection
                        className="section-gap !pt-0 pb-20"
                        fallback={<SectionSkeleton />}
                    >
                        <Suspense fallback={<SectionSkeleton />}>
                            <CTASection ctaHref={ctaHref} ctaLabel={ctaLabel} />
                        </Suspense>
                    </LazySection>
                </main>

                {/* FOOTER */}
                <footer className="relative z-10 border-t border-slate-900/10 bg-white/40 dark:border-white/10 dark:bg-black/20">
                    <div className="mx-auto max-w-7xl px-6 py-14 md:px-8">
                        <div className="grid gap-12 md:grid-cols-[1.7fr_1fr_1fr_1.3fr]">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white">
                                        <AppLogoIcon className="size-5" />
                                    </span>
                                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                                        OptiAsset
                                    </span>
                                </div>
                                <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                    Sistem manajemen aset internal untuk
                                    organisasi modern: terpusat, tercatat penuh,
                                    dan aman lewat SSO korporat.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-mono text-[11px] font-bold tracking-[0.18em] text-slate-900 uppercase dark:text-white">
                                    Navigasi
                                </h4>
                                <ul className="mt-5 space-y-3">
                                    {[
                                        ['#fitur', 'Fitur Utama'],
                                        ['#hirarki', 'Hirarki'],
                                        ['#cara-kerja', 'Cara Kerja'],
                                        ...(auth?.user
                                            ? [['/organizations', 'Organisasi']]
                                            : []),
                                    ].map(([href, label]) => (
                                        <li key={href}>
                                            <a
                                                href={href}
                                                className="text-sm font-medium text-slate-500 transition-colors hover:text-[#0080FF] dark:text-slate-400 dark:hover:text-[#6971ec]"
                                            >
                                                {label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-mono text-[11px] font-bold tracking-[0.18em] text-slate-900 uppercase dark:text-white">
                                    Akses
                                </h4>
                                <ul className="mt-5 space-y-3">
                                    <li>
                                        <a
                                            href={ctaHref}
                                            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#0080FF] dark:text-slate-400 dark:hover:text-[#6971ec]"
                                        >
                                            {ctaLabel}
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="/auth/redirect"
                                            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#0080FF] dark:text-slate-400 dark:hover:text-[#6971ec]"
                                        >
                                            SSO Perusahaan
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-xl border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.06]">
                                <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.16em] text-emerald-500">
                                    <span className="pulse-dot size-1.5 rounded-full bg-emerald-500" />
                                    SEMUA LAYANAN NORMAL
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>Uptime 30 hari</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                        99,98%
                                    </span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>Versi</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                        2026.08
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-900/10 pt-8 sm:flex-row dark:border-white/10">
                            <span className="text-sm text-slate-500 dark:text-slate-500">
                                © {new Date().getFullYear()} OptiAsset Inc.
                            </span>
                            <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                                Internal Asset Management System
                            </span>
                        </div>
                    </div>
                </footer>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.20/latin-400.css');
                    @import url('https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.20/latin-700.css');

                    ::selection { background: rgba(0, 128, 255, 0.22); }
                    * { scrollbar-width: thin; scrollbar-color: rgba(0, 128, 255, 0.35) transparent; }
                    html { scroll-behavior: smooth; }

                    .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important; }

                    .section-gap { padding-block: clamp(4rem, 7vw, 7.5rem); }

                    .noise-layer { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 180px 180px; opacity: .045; mix-blend-mode: multiply; pointer-events: none; }
                    .dark .noise-layer { opacity: .08; mix-blend-mode: screen; }

                    .dotgrid { background-image: radial-gradient(rgba(15, 23, 42, .12) 1px, transparent 1.4px); background-size: 18px 18px; }
                    .dark .dotgrid { background-image: radial-gradient(rgba(255, 255, 255, .12) 1px, transparent 1.4px); }

                    .blob-drift-a { animation: blobDriftA 22s ease-in-out infinite alternate; }
                    .blob-drift-b { animation: blobDriftB 26s ease-in-out infinite alternate; }
                    @keyframes blobDriftA { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(60px, 40px, 0) scale(1.08); } }
                    @keyframes blobDriftB { from { transform: translate3d(0, 0, 0) scale(1.05); } to { transform: translate3d(-50px, -30px, 0) scale(.96); } }

                    .reveal { opacity: 0; transform: translateY(16px); transition: opacity .42s ease-out, transform .42s cubic-bezier(.22, 1, .36, 1); }
                    .reveal.is-in { opacity: 1; transform: none; }

                    .marquee-mask { mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent); }
                    @keyframes marqueeMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                    .marquee-track { animation: marqueeMove 36s linear infinite; }

                    .laser { position: absolute; top: 0; bottom: 0; left: 0; width: 2px; opacity: 0; background: linear-gradient(to bottom, transparent, #20B2AA 30%, #7CF5EC 50%, #20B2AA 70%, transparent); box-shadow: 0 0 12px 2px rgba(32, 178, 170, .65); animation: laserSweep 2.4s cubic-bezier(.45, 0, .55, 1) infinite; }
                    @keyframes laserSweep { 0% { transform: translateX(0); opacity: 0; } 7% { opacity: 1; } 86% { opacity: 1; } 96%, 100% { transform: translateX(var(--scan-w, 220px)); opacity: 0; } }

                    .deck-para { transform: translate(calc(var(--px, 0) * var(--depth, 12px)), calc(var(--py, 0) * var(--depth, 12px))); transition: transform .5s cubic-bezier(.22, 1, .36, 1); will-change: transform; }
                    @keyframes floatY { from { transform: translateY(-4px); } to { transform: translateY(5px); } }
                    .float-slow { animation: floatY 5.5s ease-in-out infinite alternate; }

                    .level-in { animation: levelIn .42s cubic-bezier(.22, 1, .36, 1) both; }
                    @keyframes levelIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

                    .h-item:hover:not(:disabled) { border-color: color-mix(in srgb, var(--band) 50%, transparent); box-shadow: 0 14px 30px -16px color-mix(in srgb, var(--band) 55%, transparent); }

                    @keyframes rowCrawl { 0%, 24% { transform: translateY(0); } 33%, 57% { transform: translateY(64px); } 66%, 90% { transform: translateY(128px); } 100% { transform: translateY(0); } }
                    .row-crawler { animation: rowCrawl 7.5s ease-in-out infinite; }

                    @keyframes scanPop { 0% { opacity: 0; transform: translateY(8px); } 16% { opacity: 1; transform: none; } 80% { opacity: 1; } 96%, 100% { opacity: 0; transform: translateY(-4px); } }
                    .scan-pop { animation: scanPop 2.4s ease-in-out infinite; }

                    .dash-line { background-image: repeating-linear-gradient(90deg, currentColor 0 5px, transparent 5px 11px); }
                    .dash-line-v { background-image: repeating-linear-gradient(180deg, currentColor 0 5px, transparent 5px 11px); }
                    .packet { position: absolute; top: 0; left: 0; width: 7px; height: 7px; border-radius: 9999px; offset-rotate: 0deg; animation: packetMove 2.6s linear infinite; }
                    @keyframes packetMove { 0% { offset-distance: 0%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }

                    .keycard-sheen { position: absolute; top: -20%; bottom: -20%; width: 45%; left: 0; transform: translateX(-130%) skewX(-14deg); background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .4), transparent); animation: sheen 5.5s ease-in-out infinite; pointer-events: none; }
                    @keyframes sheen { 0%, 55% { transform: translateX(-130%) skewX(-14deg); } 85%, 100% { transform: translateX(330%) skewX(-14deg); } }

                    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.8); } }
                    .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }

                    .word-glow { text-shadow: 0 0 32px color-mix(in srgb, currentColor 38%, transparent); }

                    @media (prefers-reduced-motion: reduce) {
                        html { scroll-behavior: auto; }
                        .marquee-track, .laser, .deck-para, .float-slow, .row-crawler, .scan-pop, .packet, .keycard-sheen, .blob-drift-a, .blob-drift-b, .pulse-dot { animation: none !important; }
                        .laser, .packet, .scan-pop { opacity: 0 !important; }
                        .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
                    }
                `,
                }}
            />
        </>
    );
}

function SectionSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-900/5 dark:bg-white/5" />
            <div className="h-64 animate-pulse rounded-2xl border border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/[0.04]" />
        </div>
    );
}
