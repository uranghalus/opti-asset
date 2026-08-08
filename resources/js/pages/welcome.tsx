import { Head, usePage } from '@inertiajs/react';
import { ArrowLeftRight, Database, Recycle, ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';

const features = [
    {
        code: '01',
        title: 'Manajemen Data Aset',
        description:
            'Satu sumber data terpadu untuk seluruh aset perusahaan. Lacak detail, status, dan riwayat setiap item dari pengadaan hingga pemutihan.',
        color: '#0080FF',
        icon: Database,
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
        color: '#20B2AA',
        icon: ScanLine,
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
        color: '#6971ec',
        icon: ArrowLeftRight,
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
        color: '#EC4B9E',
        icon: Recycle,
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
        color: '#20B2AA',
    },
    {
        title: 'Temukan Data',
        description:
            'Catatan lengkap langsung muncul: lokasi, departemen pemegang, status kelayakan, dan riwayat.',
        color: '#0080FF',
    },
    {
        title: 'Kelola & Eksekusi',
        description:
            'Lanjutkan aksi — transfer, perawatan, atau disposisi — semua langsung tercatat dan diaudit otomatis.',
        color: '#6971ec',
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
const WORDS = [
    { word: 'Lacak', color: '#0080FF' },
    { word: 'Pindai', color: '#20B2AA' },
    { word: 'Kelola', color: '#6971ec' },
    { word: 'Audit', color: '#EC4B9E' },
];

const LEVELS = [
    {
        id: 'golongan',
        name: 'Golongan',
        code: 'GOL',
        color: '#0080FF',
        tilt: '-4deg',
        depth: 10,
        sway: '7s',
        style: { top: '6%', left: '0%', width: '68%' },
    },
    {
        id: 'kategori',
        name: 'Kategori',
        code: 'KAT',
        color: '#6971ec',
        tilt: '4deg',
        depth: 16,
        sway: '9s',
        style: { top: '20%', right: '0%', width: '62%' },
    },
    {
        id: 'cluster',
        name: 'Cluster',
        code: 'CLU',
        color: '#EC4B9E',
        tilt: '-3deg',
        depth: 22,
        sway: '11s',
        style: { bottom: '10%', left: '2%', width: '70%' },
    },
    {
        id: 'sub',
        name: 'Sub Cluster',
        code: 'SUB',
        color: '#20B2AA',
        tilt: '3.5deg',
        depth: 28,
        sway: '13s',
        style: { top: '46%', left: '16%', width: '64%' },
    },
];

const HIERARCHY = [
    {
        id: 'golongan',
        name: 'Golongan',
        code: 'GOL',
        color: '#0080FF',
        desc: 'Kelompok aset tingkat tertinggi. Contoh data sintetis.',
        items: [
            { code: 'GOL-01', name: 'Perangkat IT', count: 4 },
            { code: 'GOL-02', name: 'Fasilitas', count: 3 },
            { code: 'GOL-03', name: 'Kendaraan Operasional', count: 2 },
        ],
    },
    {
        id: 'kategori',
        name: 'Kategori',
        code: 'KAT',
        color: '#6971ec',
        desc: 'Di bawah Golongan "Perangkat IT" — pembagian jenis.',
        items: [
            { code: 'KAT-11', name: 'Hardware', count: 3 },
            { code: 'KAT-12', name: 'Jaringan', count: 2 },
            { code: 'KAT-13', name: 'Software', count: 2 },
        ],
    },
    {
        id: 'cluster',
        name: 'Cluster',
        code: 'CLU',
        color: '#EC4B9E',
        desc: 'Di bawah Kategori "Hardware" — pengelompokan spesifik.',
        items: [
            { code: 'CLU-111', name: 'Komputer', count: 2 },
            { code: 'CLU-112', name: 'Server', count: 2 },
            { code: 'CLU-113', name: 'Aksesori', count: 3 },
        ],
    },
    {
        id: 'sub',
        name: 'Sub Cluster',
        code: 'SUB',
        color: '#20B2AA',
        desc: 'Tingkat paling detail — entitas aset yang sesungguhnya.',
        items: [
            { code: 'SUB-1111', name: 'Laptop', count: 214 },
            { code: 'SUB-1112', name: 'Workstation', count: 46 },
            { code: 'SUB-1113', name: 'Mini PC', count: 89 },
        ],
    },
];

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
            className="group flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-slate-700 shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
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
            className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
            {children}
        </a>
    );
}

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

function Canopy() {
    const stageRef = useRef<HTMLDivElement | null>(null);

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = stageRef.current;

        if (!el) {
            return;
        }

        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
    };

    const handleLeave = () => {
        const el = stageRef.current;

        if (!el) {
            return;
        }

        el.style.setProperty('--px', '0');
        el.style.setProperty('--py', '0');
    };

    return (
        <div
            ref={stageRef}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            className="relative h-[420px] w-full select-none sm:h-[460px]"
        >
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/50 shadow-2xl shadow-[#0B3D6B]/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/50">
                <div className="absolute -top-20 -left-16 size-72 rounded-full bg-[#0080FF]/15 blur-3xl" />
                <div className="absolute right-[-4rem] bottom-[-3rem] size-72 rounded-full bg-[#EC4B9E]/10 blur-3xl" />
                <div className="absolute top-[30%] left-[35%] size-56 rounded-full bg-[#20B2AA]/10 blur-3xl" />

                <div className="relative flex h-full flex-col p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-slate-500 uppercase dark:text-slate-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Hierarchy Live
                        </span>
                        <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase dark:text-slate-500">
                            SSE · SYNCED
                        </span>
                    </div>

                    <div className="relative mt-3 flex-1">
                        {LEVELS.map((level, i) => {
                            const next = LEVELS[(i + 1) % LEVELS.length];

                            return (
                                <div
                                    key={level.id}
                                    className="canopy-band group absolute"
                                    style={
                                        {
                                            ...level.style,
                                            '--tilt': level.tilt,
                                            '--depth': `${level.depth}px`,
                                            '--sway': level.sway,
                                            '--band': level.color,
                                        } as unknown as CSSProperties
                                    }
                                >
                                    <div className="canopy-sway">
                                        <div className="canopy-para">
                                            <div className="canopy-glass flex items-center justify-between gap-3 rounded-2xl border border-white/40 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-md dark:border-white/10 dark:shadow-black/30">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span
                                                        className="size-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            background:
                                                                level.color,
                                                            boxShadow: `0 0 0 4px ${level.color}26`,
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <div
                                                            className="font-mono text-[10px] font-bold tracking-widest uppercase"
                                                            style={{
                                                                color: level.color,
                                                            }}
                                                        >
                                                            {level.code}
                                                        </div>
                                                        <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                            {level.name}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="chord-badge shrink-0 rounded-lg border border-white/60 bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                                                    → {next.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="scan-strip absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-white/50 bg-black/70 px-3 py-2 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-black/60">
                            <div className="flex items-end gap-[2px]">
                                {BARCODE.slice(0, 24).map((w, i) => (
                                    <span
                                        key={i}
                                        className="bg-white"
                                        style={{
                                            width: `${w}px`,
                                            height: '26px',
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="scan-laser absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-[#20B2AA] to-transparent shadow-[0_0_8px_2px_rgba(32,178,170,0.7)]" />
                            <span className="font-mono text-[10px] tracking-widest text-emerald-400">
                                SCAN
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HierarchyExplorer() {
    const [active, setActive] = useState(0);
    const level = HIERARCHY[active];

    const drill = () => {
        if (active < HIERARCHY.length - 1) {
            setActive(active + 1);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/50 shadow-2xl shadow-[#0B3D6B]/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/50">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-900/10 p-4 sm:p-5 dark:border-white/10">
                {HIERARCHY.map((lvl, i) => (
                    <button
                        key={lvl.id}
                        onClick={() => setActive(i)}
                        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none ${
                            i === active
                                ? 'border-transparent text-white shadow-lg'
                                : 'border-slate-900/10 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                        }`}
                        style={
                            i === active ? { background: lvl.color } : undefined
                        }
                    >
                        <span
                            className="size-1.5 rounded-full"
                            style={{
                                background: i === active ? '#fff' : lvl.color,
                            }}
                        />
                        {lvl.name}
                    </button>
                ))}
            </div>

            <div key={level.id} className="level-panel p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    {HIERARCHY.slice(0, active + 1).map((lvl, i) => (
                        <span
                            key={lvl.id}
                            className="flex items-center gap-1.5"
                        >
                            {i > 0 && (
                                <span className="text-slate-300 dark:text-slate-600">
                                    /
                                </span>
                            )}
                            <span style={{ color: lvl.color }}>{lvl.name}</span>
                        </span>
                    ))}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {level.desc}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {level.items.map((item) => (
                        <button
                            key={item.code}
                            onClick={drill}
                            disabled={active >= HIERARCHY.length - 1}
                            className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-900/10 bg-white/80 px-4 py-4 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none disabled:cursor-default disabled:hover:translate-y-0 dark:border-white/10 dark:bg-white/[0.06]"
                            style={
                                {
                                    '--band': level.color,
                                } as CSSProperties
                            }
                        >
                            <div className="min-w-0">
                                <div
                                    className="font-mono text-[10px] font-bold tracking-wider"
                                    style={{ color: level.color }}
                                >
                                    {item.code}
                                </div>
                                <div className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                                    {item.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {item.count} entitas
                                </div>
                            </div>
                            {active < HIERARCHY.length - 1 && (
                                <span
                                    className="shrink-0 rounded-lg bg-slate-900/5 px-2 py-1 text-[10px] font-bold text-slate-500 transition-all duration-200 group-hover:text-white dark:bg-white/10 dark:text-slate-300"
                                    style={{
                                        transitionProperty:
                                            'background-color,color',
                                    }}
                                >
                                    <span className="group-hover:hidden">
                                        ▼
                                    </span>
                                    <span
                                        className="hidden group-hover:inline"
                                        style={{ color: level.color }}
                                    >
                                        Drill ↓
                                    </span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-900/10 pt-4 dark:border-white/10">
                    <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase dark:text-slate-500">
                        {active < HIERARCHY.length - 1
                            ? 'Klik kartu untuk memperdalam'
                            : 'Tingkat terdalam — entitas aset'}
                    </span>
                    <button
                        onClick={() => setActive(0)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none dark:text-slate-400 dark:hover:text-white"
                    >
                        Mulai ulang
                    </button>
                </div>
            </div>
        </div>
    );
}

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
            {/* CONTRACT: OptiAsset Welcome — Canopy Sutra. THESIS: 4-level classification as translucent silk canopy; overlap = parent-child chord. OWN-WORLD: Electric Blue, Neon Purple, Vivid Pink, Teal silk panels over bright glass field. STORY: visitor grasps 4-level classification hierarchy linking every asset. FIRST VIEWPORT: word-roll headline + CTA left; 4-band hierarchy stage with pointer-reactivity right. FORM: surface concept #5 from roll 61e77c09. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md. */}
            <Head title="OptiAsset - Sistem Manajemen Aset" />
            <div className="relative min-h-[100dvh] overflow-hidden text-slate-900 dark:text-white">
                <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#F6F8FD] dark:bg-[#0a0f1e]">
                    <div className="absolute -top-[20%] -left-[10%] h-[560px] w-[560px] rounded-full bg-[#0080FF]/20 blur-[130px] dark:bg-[#0080FF]/15" />
                    <div className="absolute top-[12%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#6971ec]/20 blur-[140px] dark:bg-[#6971ec]/15" />
                    <div className="absolute bottom-[-15%] left-[28%] h-[480px] w-[480px] rounded-full bg-[#20B2AA]/15 blur-[130px] dark:bg-[#20B2AA]/10" />
                    <div className="absolute top-[40%] left-[-6%] h-[340px] w-[340px] rounded-full bg-[#EC4B9E]/10 blur-[120px] dark:bg-[#EC4B9E]/10" />
                    <div className="absolute top-[35%] left-[42%] h-[300px] w-[300px] rounded-full bg-[#6971ec]/10 blur-[110px] dark:bg-[#6971ec]/[0.08]" />
                    <div className="absolute right-[18%] bottom-[6%] h-[260px] w-[260px] rounded-full bg-[#0080FF]/10 blur-[110px] dark:bg-[#0080FF]/[0.06]" />
                </div>

                <header
                    className={`sticky top-0 z-40 px-4 transition-all duration-300 md:px-6 ${scrolled ? 'pt-3' : 'pt-5'}`}
                >
                    <nav
                        className={`mx-auto flex max-w-6xl items-center justify-between gap-6 rounded-2xl border px-4 py-3 backdrop-blur-2xl transition-all duration-300 ${scrolled ? 'border-slate-900/10 bg-white/80 shadow-lg shadow-[#0B3D6B]/5 dark:border-white/10 dark:bg-[#0a0f1e]/80' : 'border-transparent bg-transparent'}`}
                    >
                        <a
                            href="#"
                            className="flex items-center gap-2.5 transition-transform hover:scale-105"
                        >
                            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white shadow-md shadow-[#0080FF]/20">
                                <AppLogoIcon className="size-5" />
                            </span>
                            <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                                OptiAsset
                            </span>
                        </a>

                        <div className="hidden items-center gap-8 md:flex">
                            <NavLink href="#fitur">Fitur</NavLink>
                            <NavLink href="#cara-kerja">Cara Kerja</NavLink>
                            <NavLink href="#hirarki">Hirarki</NavLink>
                            {auth?.user && (
                                <NavLink href="/organizations">
                                    Organisasi
                                </NavLink>
                            )}
                        </div>

                        <div className="hidden items-center gap-3 md:flex">
                            <ThemeToggle />
                            <a
                                href={ctaHref}
                                className="group relative inline-flex items-center gap-2 rounded-xl bg-[#0080FF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/40 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none active:translate-y-0 active:scale-95"
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
                            </a>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="flex size-10 items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-slate-700 shadow-sm backdrop-blur-md focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                                aria-label="Buka menu"
                                aria-expanded={mobileOpen}
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
                        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-slate-900/10 bg-white/95 shadow-xl backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-[#0a0f1e]/95">
                            <div className="flex flex-col p-3">
                                {[
                                    ['#fitur', 'Fitur'],
                                    ['#cara-kerja', 'Cara Kerja'],
                                    ['#hirarki', 'Hirarki'],
                                    ...(auth?.user
                                        ? [['/organizations', 'Organisasi']]
                                        : []),
                                ].map(([href, label]) => (
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
                                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0080FF] px-4 py-3 text-sm font-semibold text-white shadow-md active:scale-95"
                                >
                                    {ctaLabel}
                                </a>
                            </div>
                        </div>
                    )}
                </header>

                <main className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
                    <section className="flex flex-col items-center gap-14 pt-14 pb-24 md:pt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-36">
                        <div className="flex max-w-xl flex-col items-start text-left">
                            <Reveal>
                                <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl lg:text-[4.25rem] dark:text-white">
                                    <span className="relative inline-block h-[1.05em] overflow-hidden align-bottom">
                                        <span className="word-roll flex flex-col">
                                            {[...WORDS, WORDS[0]].map(
                                                (w, i) => (
                                                    <span
                                                        key={`${w.word}-${i}`}
                                                        className="block leading-[1.05]"
                                                        style={{
                                                            color: w.color,
                                                        }}
                                                    >
                                                        {w.word}
                                                    </span>
                                                ),
                                            )}
                                        </span>
                                    </span>{' '}
                                    setiap aset.
                                    <br />
                                    <span className="font-semibold text-slate-400 dark:text-slate-500">
                                        Catatan lengkap
                                    </span>{' '}
                                    terkelola.
                                </h1>
                            </Reveal>
                            <Reveal delay={80}>
                                <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                    OptiAsset menyatukan data, lokasi, dan
                                    riwayat setiap aset dalam satu single source
                                    of truth. Pindai, temukan, kelola — secepat
                                    kilat.
                                </p>
                            </Reveal>
                            <Reveal delay={160}>
                                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <a
                                        href={ctaHref}
                                        className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0080FF] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#0080FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/40 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none active:translate-y-0 active:scale-95"
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
                                    </a>
                                    <a
                                        href="#fitur"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900/10 bg-white/40 px-7 py-3.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    >
                                        Lihat Kemampuan
                                    </a>
                                </div>
                            </Reveal>
                            <Reveal delay={240}>
                                <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[11px] tracking-wider text-slate-500 uppercase dark:text-slate-400">
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
                            </Reveal>
                        </div>

                        <Reveal delay={120} className="w-full max-w-lg">
                            <Canopy />
                        </Reveal>
                    </section>

                    <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white/40 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
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
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {row.name}
                                            </span>
                                            <span className="text-[#0080FF] dark:text-[#6971ec]">
                                                {row.id}
                                            </span>
                                            <span className="text-slate-400 dark:text-slate-600">
                                                /
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                {row.loc}
                                            </span>
                                        </span>
                                    ))}
                                </span>
                            ))}
                        </div>
                    </div>

                    <section id="fitur" className="scroll-mt-32 py-24 md:py-36">
                        <div className="mb-16 flex max-w-2xl flex-col items-start">
                            <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-[3.4rem] dark:text-white">
                                Siklus penuh aset,
                                <br />
                                <span className="text-slate-400 dark:text-slate-500">
                                    terkontrol sempurna.
                                </span>
                            </h2>
                            <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-400">
                                Dari pengada hingga penghapusan — setiap langkah
                                tercatat otomatis, setiap keputusan tervalidasi.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {features.map((feature, i) => {
                                const Icon = feature.icon;

                                return (
                                    <Reveal key={feature.code} delay={i * 60}>
                                        <article
                                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-900/10 bg-white/50 p-7 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0B0B6B]/10 md:p-9 lg:flex-row lg:items-center lg:gap-10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                                            style={
                                                {
                                                    '--band': feature.color,
                                                } as CSSProperties
                                            }
                                        >
                                            <div
                                                className="pointer-events-none absolute inset-y-0 left-0 w-1 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                                                style={{
                                                    background: `linear-gradient(to bottom, ${feature.color}, ${feature.color}66)`,
                                                }}
                                            />
                                            <div className="flex items-center gap-5 lg:w-1/2 lg:pl-4">
                                                <span
                                                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${feature.color}, ${feature.color}99)`,
                                                    }}
                                                >
                                                    <Icon className="size-6" />
                                                </span>
                                                <div>
                                                    <div
                                                        className="font-mono text-[10px] font-bold tracking-widest uppercase"
                                                        style={{
                                                            color: feature.color,
                                                        }}
                                                    >
                                                        Tahap {feature.code}
                                                    </div>
                                                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                                        {feature.title}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="mt-5 lg:mt-0 lg:w-1/2 lg:pr-4">
                                                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                                    {feature.description}
                                                </p>
                                                <ul className="mt-5 flex flex-wrap gap-2">
                                                    {feature.ops.map((op) => (
                                                        <li
                                                            key={op}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur transition-all duration-200 group-hover:border-transparent dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
                                                        >
                                                            <span
                                                                className="size-1.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        feature.color,
                                                                }}
                                                            />
                                                            {op}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </article>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </section>

                    <section
                        id="hirarki"
                        className="scroll-mt-32 pb-24 md:pb-32"
                    >
                        <div className="mb-14 flex flex-col items-start">
                            <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-[3.4rem] dark:text-white">
                                Empat lapis,
                                <br />
                                <span className="text-slate-400 dark:text-slate-500">
                                    satu kanopi hirarki.
                                </span>
                            </h2>
                            <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-400">
                                Golongan → Kategori → Cluster → Sub Cluster.
                                Jelajahi sendiri — setiap lapis menautkan aset
                                ke keputusan.
                            </p>
                        </div>
                        <Reveal>
                            <HierarchyExplorer />
                        </Reveal>
                    </section>

                    <section
                        id="cara-kerja"
                        className="scroll-mt-32 pb-24 md:pb-32"
                    >
                        <div className="mb-14 flex flex-col items-start">
                            <h2 className="text-3xl font-bold tracking-tight md:text-5xl dark:text-white">
                                Tiga langkah mudah.
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                Alur kerja yang intuitif untuk semua peran.
                            </p>
                        </div>

                        <div className="relative">
                            <svg
                                className="pointer-events-none absolute top-8 left-0 hidden h-8 w-full md:block"
                                viewBox="0 0 1200 32"
                                fill="none"
                                preserveAspectRatio="none"
                                aria-hidden
                            >
                                <path
                                    className="path-line"
                                    d="M 0 16 H 400 Q 460 4 520 16 H 680 Q 740 28 800 16 H 1200"
                                    stroke="url(#pathGrad)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient
                                        id="pathGrad"
                                        x1="0"
                                        y1="0"
                                        x2="1200"
                                        y2="0"
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <stop stopColor="#20B2AA" />
                                        <stop
                                            offset="0.5"
                                            stopColor="#0080FF"
                                        />
                                        <stop offset="1" stopColor="#6971ec" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="relative grid gap-6 md:grid-cols-3 md:gap-4">
                                {steps.map((step, i) => (
                                    <Reveal key={step.title} delay={i * 120}>
                                        <div className="group relative rounded-3xl border border-slate-900/10 bg-white/45 p-8 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]">
                                            <div
                                                className="mb-6 flex size-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`,
                                                }}
                                            >
                                                {i + 1}
                                            </div>
                                            <h3
                                                className="text-xl font-bold text-slate-900 dark:text-white"
                                                style={{ color: 'inherit' }}
                                            >
                                                {step.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="pb-24 md:pb-36">
                        <Reveal>
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-white/40 px-8 py-20 text-center shadow-2xl shadow-[#0B0B3B]/10 backdrop-blur-2xl md:px-16 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#0080FF]/20 blur-[100px]" />
                                <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-[#6971ec]/20 blur-[100px]" />
                                <div className="pointer-events-none absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC4B9E]/10 blur-[90px]" />
                                <div className="relative z-10">
                                    <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-extrabold tracking-tight md:text-5xl dark:text-white">
                                        Kendalikan aset Anda hari ini.
                                    </h2>
                                    <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
                                        Gunakan akun SSO korporat Anda untuk
                                        masuk dan mulai mengelola ribuan aset
                                        dalam hitungan menit.
                                    </p>
                                    <a
                                        href={ctaHref}
                                        className="group mt-10 inline-flex items-center gap-2.5 rounded-2xl bg-[#0080FF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#0080FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0b6fd4] hover:shadow-[#0080FF]/45 focus-visible:ring-2 focus-visible:ring-[#0080FF]/60 focus-visible:outline-none active:translate-y-0 active:scale-95"
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
                                    </a>
                                </div>
                            </div>
                        </Reveal>
                    </section>
                </main>

                <footer className="relative z-10 border-t border-slate-900/10 bg-white/30 px-6 py-14 backdrop-blur-xl md:px-8 dark:border-white/[0.06] dark:bg-black/20">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white">
                                        <AppLogoIcon className="size-5" />
                                    </span>
                                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                                        OptiAsset
                                    </span>
                                </div>
                                <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                    Sistem manajemen aset internal canggih untuk
                                    organisasi modern. Tersentral, jejak penuh,
                                    integrasi aman.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-mono text-xs font-bold tracking-widest text-slate-900 uppercase dark:text-white">
                                    Navigasi
                                </h4>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        ['#fitur', 'Fitur Utama'],
                                        ['#cara-kerja', 'Cara Kerja'],
                                        ['#hirarki', 'Hirarki'],
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
                                <h4 className="font-mono text-xs font-bold tracking-widest text-slate-900 uppercase dark:text-white">
                                    Akses
                                </h4>
                                <ul className="mt-6 space-y-3">
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
                        </div>
                        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-900/10 pt-8 sm:flex-row dark:border-white/10">
                            <span className="text-sm text-slate-500 dark:text-slate-500">
                                © {new Date().getFullYear()} OptiAsset Inc.
                            </span>
                            <span className="mt-2 text-sm text-slate-500 sm:mt-0 dark:text-slate-500">
                                Internal Asset Management System
                            </span>
                        </div>
                    </div>
                </footer>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    ::selection { background: rgba(0, 128, 255, 0.25); }
                    * { scrollbar-width: thin; scrollbar-color: rgba(0, 128, 255, 0.4) transparent; }

                    @keyframes scanSweep {
                        0%, 100% { transform: translateX(0); opacity: 0; }
                        15% { opacity: 1; }
                        50% { transform: translateX(118px); opacity: 1; }
                        85% { opacity: 1; }
                        100% { transform: translateX(0); opacity: 0; }
                    }
                    .scan-laser { animation: scanSweep 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite; }

                    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                    .marquee-track { animation: marquee 30s linear infinite; }

                    @keyframes wordRoll {
                        0%, 16% { transform: translateY(0); }
                        20%, 36% { transform: translateY(-20%); }
                        40%, 56% { transform: translateY(-40%); }
                        60%, 76% { transform: translateY(-60%); }
                        80%, 96% { transform: translateY(-80%); }
                        100% { transform: translateY(-80%); }
                    }
                    .word-roll { animation: wordRoll 8s cubic-bezier(0.65, 0, 0.35, 1) infinite; }

                    .reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
                    .reveal.is-in { opacity: 1; transform: none; }

                    .canopy-band { transform: rotate(var(--tilt)); }
                    @keyframes silkSway {
                        from { transform: rotate(-1.2deg) translateY(0); }
                        to { transform: rotate(1.2deg) translateY(9px); }
                    }
                    .canopy-sway { animation: silkSway var(--sway) ease-in-out infinite alternate; will-change: transform; }
                    .canopy-para {
                        transform: translate(calc(var(--px, 0) * var(--depth)), calc(var(--py, 0) * var(--depth)));
                        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
                        will-change: transform;
                    }
                    .canopy-glass {
                        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                            box-shadow 0.35s, border-color 0.35s, background-color 0.35s;
                    }
                    .canopy-band:hover .canopy-glass {
                        transform: translateY(-6px) scale(1.02);
                        box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.25);
                        border-color: color-mix(in srgb, var(--band) 50%, transparent);
                    }
                    .chord-badge { opacity: 0; transform: translateY(4px); transition: opacity 0.25s, transform 0.25s; }
                    .canopy-band:hover .chord-badge { opacity: 1; transform: none; }

                    .level-panel { animation: levelIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
                    @keyframes levelIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: none; }
                    }

                    .feature-card-item:hover { background: color-mix(in srgb, var(--band) 14%, transparent) !important; }

                    .path-line { stroke-dasharray: 1300; stroke-dashoffset: 1300; }
                    .reveal.is-in .path-line { animation: drawLine 1.8s ease-out 0.2s forwards; }
                    @keyframes drawLine { to { stroke-dashoffset: 0; } }

                    @media (prefers-reduced-motion: reduce) {
                        .scan-laser, .marquee-track, .word-roll, .canopy-sway, .canopy-para, .level-panel { animation: none !important; transition: none !important; transform: none !important; opacity: 1 !important; }
                        .reveal { opacity: 1; transform: none; transition: none; }
                        .path-line { stroke-dashoffset: 0; }
                    }
                `,
                }}
            />
        </>
    );
}
