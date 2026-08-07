import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';

const features = [
    {
        code: '01',
        title: 'Manajemen Data Aset',
        description:
            'Satu sumber data terpadu untuk seluruh aset perusahaan. Lacak detail, status, dan riwayat setiap item dari pengadaan hingga pemutihan.',
        ops: [
            'Kategori & klasifikasi 4 level',
            'Riwayat & jejak audit tiap item',
            'Multi-departemen terisolasi',
        ],
    },
    {
        code: '02',
        title: 'Pemindaian Barcode',
        description:
            'Temukan data aset secara instan hanya dengan memindai barcode. Proses pencarian yang cepat dan akurat untuk ribuan aset.',
        ops: [
            'Scan instan tanpa ketik manual',
            'Kode aset unik per organisasi',
            'Akses catatan langsung dari lapangan',
        ],
    },
    {
        code: '03',
        title: 'Transfer Aset',
        description:
            'Pindahkan aset antar departemen atau lokasi dengan alur persetujuan yang terstruktur dan tercatat otomatis.',
        ops: [
            'Alur persetujuan tercatat otomatis',
            'Lacak lokasi saat ini & riwayat',
            'Validasi kepemilikan departemen',
        ],
    },
    {
        code: '04',
        title: 'Disposal Aset',
        description:
            'Kelola proses disposisi aset dari pengajuan hingga persetujuan. Pantau status dan riwayat setiap aset yang didisposisi.',
        ops: [
            'Pengajuan disposisi berjenjang',
            'Status & riwayat dipantau penuh',
            'Audit jejak lengkap tiap keputusan',
        ],
    },
];

const steps = [
    {
        title: 'Pindai Barcode',
        description:
            'Arahkan kamera ke barcode aset. Identifikasi instan tanpa perlu mengetik apa pun ke dalam sistem.',
    },
    {
        title: 'Temukan Data',
        description:
            'Catatan lengkap langsung muncul: lokasi, departemen pemegang, status kelayakan, dan riwayat.',
    },
    {
        title: 'Kelola & Eksekusi',
        description:
            'Lanjutkan aksi — transfer, perawatan, atau disposisi — semua langsung tercatat dan diaudit otomatis.',
    },
];

const scanLog = [
    {
        id: 'AST-2024-0847',
        name: 'Laptop Dell Latitude 5440',
        loc: 'Lantai 3 · IT',
        status: 'Aktif',
    },
    {
        id: 'AST-2024-0851',
        name: 'Printer HP LaserJet Pro',
        loc: 'Lantai 2 · Admin',
        status: 'Aktif',
    },
    {
        id: 'AST-2023-1120',
        name: 'Meja Kerja Ergonomis',
        loc: 'Lantai 1 · HR',
        status: 'Dipindah',
    },
];

const BARCODE = [
    3, 1, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 1, 1, 2, 3, 1, 1, 1, 2,
    1, 3, 1, 2, 1, 1, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 1, 3,
];
const WORDS = ['Lacak', 'Pindai', 'Kelola', 'Audit'];

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
            className="group flex size-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-gray-700 shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Ganti tema"
        >
            {isDark ? (
                <svg
                    className="size-[18px] transition-transform duration-300 group-hover:rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                    />
                </svg>
            ) : (
                <svg
                    className="size-[18px] transition-transform duration-300 group-hover:-rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                    />
                </svg>
            )}
        </button>
    );
}

function NavLink({ href, children }: { href: string; children: string }) {
    return (
        <a
            href={href}
            className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
            {children}
        </a>
    );
}

function ScanBar() {
    return (
        <div className="scan-track pointer-events-none relative flex h-1.5 items-center overflow-visible">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#0080FF]/30" />
            <div className="scan-laser absolute top-1/2 left-0 h-[3px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_10px_2px_rgba(255,255,255,0.7)] dark:via-[#0080FF] dark:shadow-[0_0_10px_2px_rgba(0,128,255,0.6)]">
                <div className="absolute inset-0 bg-white/30 blur-[6px] dark:bg-[#0080FF]/30" />
            </div>
        </div>
    );
}

const ScanStatus = ({ status }: { status: string }) => (
    <span
        className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}
    >
        {status}
    </span>
);

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
    const ctaLabel = auth?.user ? 'Buka Dashboard' : 'Masuk SSO';

    return (
        <>
            <Head title="OptiAsset - Sistem Manajemen Aset" />
            {/* High-end operational glassmorphism */}
            <div className="relative min-h-[100dvh] overflow-hidden text-gray-900 dark:text-white">
                {/* Vivid ambient field */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#F6F8FD] dark:bg-[#05070d]">
                    <div className="absolute -top-[20%] -left-[10%] h-[560px] w-[560px] rounded-full bg-[#0080FF]/25 blur-[130px] dark:bg-[#0080FF]/20" />
                    <div className="absolute top-[12%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#6971ec]/25 blur-[140px] dark:bg-[#6971ec]/20" />
                    <div className="absolute bottom-[-15%] left-[28%] h-[480px] w-[480px] rounded-full bg-[#00B3A4]/20 blur-[130px] dark:bg-[#00B3A4]/10" />
                    <div className="absolute top-[40%] left-[-6%] h-[340px] w-[340px] rounded-full bg-[#8B00FF]/15 blur-[120px] dark:bg-[#8B00FF]/10" />
                    <div className="absolute top-[35%] left-[42%] h-[300px] w-[300px] rounded-full bg-[#FF1493]/10 blur-[110px] dark:bg-[#FF1493]/[0.06]" />
                    <div className="absolute right-[20%] bottom-[6%] h-[260px] w-[260px] rounded-full bg-[#FFD400]/15 blur-[110px] dark:bg-[#FFD400]/[0.08]" />
                </div>

                {/* Noise grain */}
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Navbar */}
                <header
                    className={`sticky top-0 z-40 px-4 transition-all duration-300 md:px-6 ${scrolled ? 'pt-3' : 'pt-5'}`}
                >
                    <nav
                        className={`mx-auto flex max-w-6xl items-center justify-between gap-6 rounded-2xl border px-4 py-3 backdrop-blur-2xl transition-all duration-300 ${scrolled ? 'border-white/60 bg-white/70 shadow-lg shadow-[#0B3D6B]/5 dark:border-white/10 dark:bg-[#0B1021]/80' : 'border-transparent bg-transparent'}`}
                    >
                        <a
                            href="#"
                            className="flex items-center gap-2.5 transition-transform hover:scale-105"
                        >
                            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white shadow-md shadow-[#0080FF]/20">
                                <AppLogoIcon className="size-5" />
                            </span>
                            <span className="font-mono text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                                OptiAsset
                            </span>
                        </a>

                        <div className="hidden items-center gap-8 md:flex">
                            <NavLink href="#fitur">Fitur</NavLink>
                            <NavLink href="#cara-kerja">Cara Kerja</NavLink>
                            {auth?.user && (
                                <NavLink href="/organizations">
                                    Organisasi
                                </NavLink>
                            )}
                        </div>

                        <div className="hidden items-center gap-3 md:flex">
                            <ThemeToggle />
                            <Link
                                href={ctaHref}
                                className="group relative inline-flex items-center gap-2 rounded-xl bg-[#0080FF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/40 active:translate-y-0 active:scale-95"
                            >
                                {ctaLabel}
                                <svg
                                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="flex size-10 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-gray-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white"
                                aria-label="Buka menu"
                            >
                                <svg
                                    className="size-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d={
                                            mobileOpen
                                                ? 'M6 18 18 6M6 6l12 12'
                                                : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                                        }
                                    />
                                </svg>
                            </button>
                        </div>
                    </nav>

                    {mobileOpen && (
                        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-[#0B1021]/95">
                            <div className="flex flex-col p-3">
                                <a
                                    href="#fitur"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    Fitur
                                </a>
                                <a
                                    href="#cara-kerja"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                                >
                                    Cara Kerja
                                </a>
                                {auth?.user && (
                                    <a
                                        href="/organizations"
                                        onClick={() => setMobileOpen(false)}
                                        className="rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                                    >
                                        Organisasi
                                    </a>
                                )}
                                <a
                                    href={ctaHref}
                                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0080FF] px-4 py-3 text-sm font-semibold text-white shadow-md active:scale-95"
                                >
                                    {ctaLabel}
                                </a>
                            </div>
                        </div>
                    )}
                </header>

                <main className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
                    {/* Hero */}
                    <section className="flex flex-col items-center gap-14 pt-14 pb-24 md:pt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-36">
                        <div className="animate-fade-in-up flex max-w-xl flex-col items-start text-left">
                            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#0080FF]/25 bg-white/50 px-3.5 py-1.5 text-xs font-semibold text-[#0080FF] shadow-sm backdrop-blur-xl dark:border-[#6971ec]/25 dark:bg-white/5 dark:text-[#6971ec]">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0080FF] opacity-60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-[#0080FF] dark:bg-[#6971ec]" />
                                </span>
                                v2.0 Live Now
                            </span>
                            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl lg:text-[4.25rem] dark:text-white">
                                <span className="relative inline-block h-[1.05em] overflow-hidden align-bottom">
                                    <span className="word-roll flex flex-col">
                                        {[...WORDS, WORDS[0]].map((word, i) => (
                                            <span
                                                key={`${word}-${i}`}
                                                className="block bg-gradient-to-r from-[#0080FF] to-[#6971ec] bg-clip-text leading-[1.05] text-transparent dark:from-[#0080FF] dark:to-[#6971ec]"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </span>
                                </span>{' '}
                                setiap aset.
                                <br />
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                    Catatan lengkap
                                </span>{' '}
                                terkelola.
                            </h1>
                            <p className="mt-7 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                                OptiAsset menyatukan data, lokasi, dan riwayat
                                setiap aset dalam satu single source of truth.
                                Pindai, temukan, kelola — secepat kilat.
                            </p>
                            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <Link
                                    href={ctaHref}
                                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0080FF] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/40 active:translate-y-0 active:scale-95"
                                >
                                    {auth?.user
                                        ? 'Buka Dashboard'
                                        : 'Mulai Sekarang'}
                                    <svg
                                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                        />
                                    </svg>
                                </Link>
                                <a
                                    href="#fitur"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/40 px-7 py-3.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/80 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    Lihat Kemampuan
                                </a>
                            </div>
                            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[11px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                <span className="inline-flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />{' '}
                                    SSO korporat
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-[#0080FF]" />{' '}
                                    Multi-dept
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-amber-500" />{' '}
                                    Real-time
                                </span>
                            </div>
                        </div>

                        {/* Scanner terminal */}
                        <div className="perspective-1000 w-full max-w-lg">
                            <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/40 p-5 shadow-2xl shadow-[#0B3D6B]/10 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-white/90 hover:shadow-[#0B3D6B]/15 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/60">
                                <div className="pointer-events-none absolute -inset-24 rounded-full bg-gradient-to-br from-[#0080FF]/10 via-[#6971ec]/5 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:from-[#0080FF]/15" />

                                <div className="relative flex items-center justify-between border-b border-white/60 pb-4 dark:border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="size-3 rounded-full bg-[#FF5F57]/90 shadow-sm" />
                                        <span className="size-3 rounded-full bg-[#FEBC2E]/90 shadow-sm" />
                                        <span className="size-3 rounded-full bg-[#28C840]/90 shadow-sm" />
                                    </div>
                                    <span className="font-mono text-[10px] tracking-widest text-gray-500 dark:text-gray-500">
                                        TERMINAL · AST-2024
                                    </span>
                                </div>

                                <div className="relative pt-5">
                                    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-inner dark:border-white/[0.08] dark:bg-black/30">
                                        <div className="flex items-end gap-[2px] opacity-90">
                                            {BARCODE.map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-[#0B0B2C] dark:bg-white"
                                                    style={{
                                                        width: `${w}px`,
                                                        height: '86px',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <ScanBar />
                                        <span className="absolute bottom-2 font-mono text-[10px] tracking-[0.3em] text-gray-500 dark:text-gray-400">
                                            0 8475 9018 3321
                                        </span>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {scanLog.map((row, i) => (
                                            <div
                                                key={row.id}
                                                className="scan-row relative flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 opacity-0 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
                                                style={{
                                                    animationDelay: `${600 + i * 200}ms`,
                                                }}
                                            >
                                                <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#0080FF] to-[#6971ec]" />
                                                <div className="min-w-0 pl-3">
                                                    <div className="font-mono text-xs font-bold text-[#0080FF] dark:text-[#6971ec]">
                                                        {row.id}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {row.name}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                        <svg
                                                            className="size-3"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                                                            />
                                                        </svg>
                                                        {row.loc}
                                                    </div>
                                                </div>
                                                <ScanStatus
                                                    status={row.status}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex items-center justify-between border-t border-white/60 pt-4 font-mono text-[10px] tracking-wider text-gray-500 dark:border-white/10 dark:text-gray-500">
                                        <span>SYSTEM LOG</span>
                                        <span className="inline-flex items-center gap-1.5 text-emerald-500">
                                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />{' '}
                                            SYNCED
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Marquee ticker */}
                    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/40 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="marquee-track flex w-max items-center rounded-xl px-4 py-3 font-mono text-[11px] tracking-wider whitespace-nowrap uppercase">
                            {Array.from({ length: 2 }).map((_, dup) => (
                                <span
                                    key={dup}
                                    className="flex items-center"
                                    aria-hidden={dup === 1}
                                >
                                    {scanLog.map((row) => (
                                        <span
                                            key={row.id}
                                            className="flex items-center gap-4 pr-12"
                                        >
                                            <span className="text-emerald-500">
                                                ●
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {row.name}
                                            </span>
                                            <span className="text-[#0080FF] dark:text-[#6971ec]">
                                                {row.id}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-600">
                                                /
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {row.loc}
                                            </span>
                                        </span>
                                    ))}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <section id="fitur" className="scroll-mt-32 py-24 md:py-36">
                        <div className="mb-16 flex max-w-2xl flex-col items-start">
                            <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-[3.4rem] dark:text-white">
                                Siklus penuh aset,
                                <br />
                                <span className="text-gray-400 dark:text-gray-500">
                                    terkontrol sempurna.
                                </span>
                            </h2>
                            <p className="mt-5 max-w-lg text-lg text-gray-600 dark:text-gray-400">
                                Dari pengada hingga penghapusan — setiap langkah
                                tercatat otomatis, setiap keputusan tervalidasi.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {features.map((feature) => (
                                <div
                                    key={feature.code}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/50 p-8 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:shadow-xl hover:shadow-[#0B0B6B]/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                                >
                                    <div className="relative z-10 flex h-full flex-col">
                                        <div className="flex items-center gap-4">
                                            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0080FF]/10 to-[#6971ec]/10 font-mono text-sm font-bold text-[#0080FF] ring-1 ring-[#0080FF]/15 dark:text-[#6971ec]">
                                                {feature.code}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {feature.title}
                                            </h3>
                                        </div>
                                        <p className="mt-5 leading-relaxed text-gray-600 dark:text-gray-400">
                                            {feature.description}
                                        </p>
                                        <ul className="mt-auto space-y-3 pt-8">
                                            {feature.ops.map((op) => (
                                                <li
                                                    key={op}
                                                    className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0080FF]/10 text-[#0080FF] dark:bg-[#6971ec]/20 dark:text-[#6971ec]">
                                                        <svg
                                                            className="size-3"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={3}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m4.5 12.75 6 6 9-13.5"
                                                            />
                                                        </svg>
                                                    </span>
                                                    {op}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* How it works */}
                    <section
                        id="cara-kerja"
                        className="scroll-mt-32 pb-24 md:pb-32"
                    >
                        <div className="mb-16 text-center md:text-left">
                            <h2 className="text-3xl leading-tight font-extrabold tracking-tight md:text-5xl dark:text-white">
                                Tiga langkah mudah.
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                Alur kerja yang intuitif untuk semua peran.
                            </p>
                        </div>
                        <div className="relative grid gap-6 md:grid-cols-3">
                            <div className="absolute top-1/2 right-[16%] left-[16%] hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-[#0080FF]/25 via-[#6971ec]/25 to-[#0080FF]/25 md:block" />
                            {steps.map((step, i) => (
                                <div
                                    key={step.title}
                                    className="relative flex flex-col items-center rounded-3xl border border-white/70 bg-white/45 p-8 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
                                >
                                    <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-2xl font-black text-white shadow-lg shadow-[#0080FF]/30">
                                        {i + 1}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {step.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="pb-24 md:pb-36">
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 px-8 py-20 text-center shadow-2xl shadow-[#0B0B3B]/10 backdrop-blur-2xl md:px-16 dark:border-white/10 dark:bg-white/[0.04]">
                            <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#0080FF]/20 blur-[100px]" />
                            <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-[#6971ec]/20 blur-[100px]" />
                            <div className="relative z-10">
                                <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-extrabold tracking-tight md:text-5xl dark:text-white">
                                    Kendalikan aset Anda hari ini.
                                </h2>
                                <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
                                    Gunakan akun SSO korporat Anda untuk masuk
                                    dan mulai mengelola ribuan aset dalam
                                    hitungan menit.
                                </p>
                                <Link
                                    href={ctaHref}
                                    className="group mt-10 inline-flex items-center gap-2.5 rounded-2xl bg-[#0080FF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#0080FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/45 active:translate-y-0 active:scale-95"
                                >
                                    {auth?.user
                                        ? 'Lanjutkan ke Dashboard'
                                        : 'Masuk via SSO Sekarang'}
                                    <svg
                                        className="size-5 transition-transform duration-300 group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                        />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="relative z-10 border-t border-white/60 bg-white/30 px-6 py-14 backdrop-blur-xl md:px-8 dark:border-white/[0.06] dark:bg-black/20">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white">
                                        <AppLogoIcon className="size-5" />
                                    </span>
                                    <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
                                        OptiAsset
                                    </span>
                                </div>
                                <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    Sistem manajemen aset internal canggih untuk
                                    organisasi modern. Tersentral, jejak penuh,
                                    integrasi aman.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-mono text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-white">
                                    Navigasi
                                </h4>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        ['#fitur', 'Fitur Utama'],
                                        ['#cara-kerja', 'Cara Kerja'],
                                        ...(auth?.user
                                            ? [['/organizations', 'Organisasi']]
                                            : []),
                                    ].map(([href, label]) => (
                                        <li key={href}>
                                            <a
                                                href={href}
                                                className="text-sm font-medium text-gray-500 transition-colors hover:text-[#0080FF] dark:text-gray-400 dark:hover:text-[#6971ec]"
                                            >
                                                {label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-mono text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-white">
                                    Akses
                                </h4>
                                <ul className="mt-6 space-y-3">
                                    <li>
                                        <a
                                            href={ctaHref}
                                            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#0080FF] dark:text-gray-400 dark:hover:text-[#6971ec]"
                                        >
                                            {ctaLabel}
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="/auth/redirect"
                                            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#0080FF] dark:text-gray-400 dark:hover:text-[#6971ec]"
                                        >
                                            SSO Perusahaan
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/60 pt-8 sm:flex-row dark:border-white/10">
                            <span className="text-sm text-gray-500 dark:text-gray-500">
                                © {new Date().getFullYear()} OptiAsset Inc.
                            </span>
                            <span className="mt-2 text-sm text-gray-500 sm:mt-0 dark:text-gray-500">
                                Internal Asset Management System
                            </span>
                        </div>
                    </div>
                </footer>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes scanSweep {
                        0%, 100% { transform: translateY(0); opacity: 0; }
                        15% { opacity: 1; }
                        50% { transform: translateY(132px); opacity: 1; }
                        85% { opacity: 1; }
                        100% { transform: translateY(0); opacity: 0; }
                    }
                    .scan-laser { animation: scanSweep 3s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
                    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                    .marquee-track { animation: marquee 30s linear infinite; }
                    @keyframes rowIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    .scan-row { animation: rowIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                    @keyframes wordRoll {
                        0%, 16% { transform: translateY(0); }
                        20%, 36% { transform: translateY(-20%); }
                        40%, 56% { transform: translateY(-40%); }
                        60%, 76% { transform: translateY(-60%); }
                        80%, 96% { transform: translateY(-80%); }
                        100% { transform: translateY(-80%); }
                    }
                    .word-roll { animation: wordRoll 8s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
                    .perspective-1000 { perspective: 1000px; }
                    @media (prefers-reduced-motion: reduce) {
                        .scan-laser, .marquee-track, .word-roll, .animate-fade-in-up, .scan-row { animation: none !important; opacity: 1 !important; transform: none !important; }
                    }
                `,
                }}
            />
        </>
    );
}
