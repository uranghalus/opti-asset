import {
    ArrowLeftRight,
    ArrowRight,
    Building2,
    CalendarDays,
    Check,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Database,
    Fingerprint,
    History,
    MapPin,
    Recycle,
    RotateCcw,
    ScanLine,
    SearchCheck,
    ShieldCheck,
} from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const BLUE = '#0080FF';
const IRIS = '#6971ec';
const TEAL = '#20B2AA';
const PINK = '#EC4B9E';

const PANEL =
    'rounded-2xl border border-white/60 bg-white/55 shadow-[0_10px_44px_-16px_rgba(15,35,80,0.22)] dark:border-white/10 dark:bg-white/[0.05]';
const CARD =
    'rounded-xl border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/[0.06]';

function cssVars(v: Record<string, string | number>): CSSProperties {
    return v as unknown as CSSProperties;
}

function BarcodeStrip({
    scale = 2,
    barHeight = 30,
    className = '',
    withLaser = true,
}: {
    scale?: number;
    barHeight?: number;
    className?: string;
    withLaser?: boolean;
}) {
    const BARCODE = [
        3, 1, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 1, 1, 2, 3, 1, 1, 1,
        2, 1, 3, 1, 2, 1, 1, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 1, 3,
    ];
    const BARCODE_TOTAL = BARCODE.reduce((a, b) => a + b, 0);
    const width = BARCODE_TOTAL * scale;

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ width, maxWidth: '100%' }}
            aria-hidden
        >
            <div className="flex items-end">
                {BARCODE.map((w, i) => (
                    <span
                        key={i}
                        className="bg-current"
                        style={{ width: w * scale, height: barHeight }}
                    />
                ))}
            </div>
            {withLaser && (
                <span
                    className="laser"
                    style={cssVars({ '--scan-w': `${width}px` })}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Scanner Deck                                                        */
/* ------------------------------------------------------------------ */

export function ScannerDeck() {
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
            className="relative mx-auto w-full max-w-[480px] px-2 py-6 select-none sm:px-0 sm:py-4"
        >
            <div
                className="absolute inset-8 rounded-3xl bg-gradient-to-br from-[#0080FF]/25 via-[#6971ec]/20 to-[#EC4B9E]/20 blur-2xl"
                aria-hidden
            />

            <div
                className="deck-para absolute inset-x-10 top-10 bottom-0 rotate-[4deg] rounded-2xl border border-white/40 bg-white/30 dark:border-white/10 dark:bg-white/[0.04]"
                style={cssVars({ '--depth': '10px' })}
                aria-hidden
            />

            <div
                className="deck-para relative"
                style={cssVars({ '--depth': '20px' })}
            >
                <div className={`${PANEL} overflow-hidden !rounded-2xl`}>
                    <div className="flex items-center justify-between border-b border-slate-900/10 px-5 py-3 dark:border-white/10">
                        <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">
                            <span className="pulse-dot size-1.5 rounded-full bg-emerald-500" />
                            AST-2024-0847
                        </span>
                        <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            AKTIF
                        </span>
                    </div>

                    <div className="px-5 pt-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Laptop Dell Latitude 5440
                        </h3>
                        <p className="font-mono text-[11px] tracking-wider text-slate-400 dark:text-slate-500">
                            GOL-01 ▸ KAT-11 ▸ CLU-111 ▸ SUB-1111
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 px-5 py-4">
                        {[
                            {
                                k: 'LOKASI',
                                v: 'Lantai 3 · Zona IT',
                                icon: MapPin,
                            },
                            {
                                k: 'DEPARTEMEN',
                                v: 'IT — Infrastruktur',
                                icon: Building2,
                            },
                            {
                                k: 'PEROLEHAN',
                                v: 'Jan 2024 · Rp 18,4 jt',
                                icon: CalendarDays,
                            },
                        ].map((row) => {
                            const RowIcon = row.icon;

                            return (
                                <div
                                    key={row.k}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-900/5 bg-white/60 px-3 py-2 dark:border-white/5 dark:bg-white/[0.04]"
                                >
                                    <span className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                        <RowIcon className="size-3.5 text-[#0080FF]" />
                                        {row.k}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        {row.v}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mx-5 mb-4 rounded-xl bg-slate-900/95 p-4 text-white dark:bg-black/60">
                        <div className="flex items-center justify-between">
                            <BarcodeStrip
                                scale={2}
                                barHeight={28}
                                className="text-white"
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-white/40">
                            <span>ID-TAG ORGANISASI</span>
                            <span className="text-emerald-400">READY</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900/10 px-5 py-3 dark:border-white/10">
                        <span className="font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-500">
                            NILAI BUKU · RP 12,1 JT
                        </span>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 rounded-md border border-slate-900/10 bg-white/70 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                                <History className="size-3" /> RIWAYAT
                            </span>
                            <span className="flex items-center gap-1.5 rounded-md bg-[#0080FF]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#0080FF]">
                                <ArrowLeftRight className="size-3" /> TRANSFER
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="deck-para absolute -top-1 -left-1 sm:-left-6"
                style={cssVars({ '--depth': '34px' })}
            >
                <div
                    className="float-slow flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-3.5 py-2.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1628]/90"
                    style={{ animationDelay: '0.4s' }}
                >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#20B2AA]/15 text-[#20B2AA]">
                        <ScanLine className="size-4" />
                    </span>
                    <span>
                        <span className="block font-mono text-[9px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500">
                            SCAN DITERIMA
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-white">
                            AST-2024-0851 · 0,4 dtk
                        </span>
                    </span>
                </div>
            </div>

            <div
                className="deck-para absolute top-1/2 -right-1 sm:-right-5"
                style={cssVars({ '--depth': '28px' })}
            >
                <div
                    className="float-slow flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-3.5 py-2.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1628]/90"
                    style={{ animationDelay: '1.2s' }}
                >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#6971ec]/15 text-[#6971ec]">
                        <ArrowLeftRight className="size-4" />
                    </span>
                    <span>
                        <span className="block font-mono text-[9px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500">
                            TRANSFER DISETUJUI
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-white">
                            IT → HR · 10:24
                        </span>
                    </span>
                </div>
            </div>

            <div
                className="deck-para absolute -bottom-4 left-1/2 -translate-x-1/2"
                style={cssVars({ '--depth': '42px' })}
            >
                <div
                    className="float-slow flex items-center gap-3 rounded-xl border border-white/60 bg-white/85 px-4 py-2.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1628]/95"
                    style={{ animationDelay: '0.8s' }}
                >
                    <BarcodeStrip
                        scale={1}
                        barHeight={16}
                        withLaser={false}
                        className="text-slate-900 dark:text-white"
                    />
                    <span className="font-mono text-[9px] font-bold tracking-[0.16em] whitespace-nowrap text-slate-500 dark:text-slate-400">
                        48 ITEM DIPINDAI HARI INI
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Feature visuals                                                     */
/* ------------------------------------------------------------------ */

function DatabaseVisual() {
    const rows = [
        {
            code: 'GOL-01',
            name: 'Perangkat IT',
            meta: '1.240 item',
            color: BLUE,
        },
        {
            code: 'GOL-02',
            name: 'Fasilitas Kantor',
            meta: '846 item',
            color: IRIS,
        },
        {
            code: 'GOL-03',
            name: 'Kendaraan Operasional',
            meta: '132 unit',
            color: PINK,
        },
    ];

    return (
        <div className="mx-auto w-full max-w-md">
            <div className="mb-2 flex items-center justify-between px-1 font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">
                <span>KODE</span>
                <span>NAMA GOLONGAN</span>
                <span>JUMLAH</span>
            </div>
            <div className="relative">
                <span
                    className="row-crawler pointer-events-none absolute inset-x-0 top-0 z-10 h-14 rounded-lg bg-[#0080FF]/10 ring-1 ring-[#0080FF]/40"
                    aria-hidden
                />
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div
                            key={row.code}
                            className="relative flex h-14 items-center gap-3 rounded-lg border border-white/60 bg-white/80 px-4 dark:border-white/10 dark:bg-white/[0.07]"
                        >
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ background: row.color }}
                            />
                            <span
                                className="w-16 font-mono text-[10px] font-bold"
                                style={{ color: row.color }}
                            >
                                {row.code}
                            </span>
                            <span className="flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {row.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                {row.meta}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <p className="mt-3 text-center font-mono text-[9px] tracking-[0.18em] text-slate-400 dark:text-slate-500">
                SUMBER TUNGGAL · TERSINKRON REAL-TIME
            </p>
        </div>
    );
}

function ScanVisual() {
    return (
        <div className="relative mx-auto w-full max-w-sm rounded-xl border border-white/60 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.05]">
            <span
                className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-[#20B2AA]"
                aria-hidden
            />
            <span
                className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-[#20B2AA]"
                aria-hidden
            />
            <span
                className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-[#20B2AA]"
                aria-hidden
            />
            <span
                className="absolute right-2 bottom-2 size-4 border-r-2 border-b-2 border-[#20B2AA]"
                aria-hidden
            />

            <div className="flex items-center justify-between font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                    <span className="pulse-dot size-1.5 rounded-full bg-[#20B2AA]" />
                    MEMINDAI
                </span>
                <span>AST-2024-0851</span>
            </div>

            <div className="mt-5 flex justify-center text-slate-900 dark:text-slate-100">
                <BarcodeStrip scale={2.2} barHeight={44} />
            </div>

            <div className="scan-pop mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#20B2AA]/40 bg-[#20B2AA]/10 px-3 py-2">
                <Check className="size-3.5 text-[#20B2AA]" strokeWidth={3} />
                <span className="font-mono text-[10px] font-bold tracking-wider text-[#20B2AA]">
                    COCOK · PRINTER HP LASERJET · ADMIN
                </span>
            </div>
        </div>
    );
}

function TransferVisual() {
    return (
        <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between gap-2">
                <div className={`${CARD} w-[104px] p-3 text-center`}>
                    <Building2 className="mx-auto size-5 text-[#6971ec]" />
                    <div className="mt-1.5 text-sm font-bold text-slate-800 dark:text-white">
                        IT
                    </div>
                    <div className="font-mono text-[9px] tracking-wider text-slate-400 dark:text-slate-500">
                        LANTAI 3
                    </div>
                </div>

                <div className="relative h-6 flex-1" aria-hidden>
                    <span className="dash-line absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                    <span
                        className="packet"
                        style={{
                            offsetPath: "path('M3 12 L100% 12')",
                            background: IRIS,
                            boxShadow: `0 0 10px ${IRIS}`,
                        }}
                    />
                </div>

                <div className={`${CARD} w-[104px] p-3 text-center`}>
                    <Building2 className="mx-auto size-5 text-[#20B2AA]" />
                    <div className="mt-1.5 text-sm font-bold text-slate-800 dark:text-white">
                        HR
                    </div>
                    <div className="font-mono text-[9px] tracking-wider text-slate-400 dark:text-slate-500">
                        LANTAI 1
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-2">
                <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-md border-2 border-[#20B2AA]/60 px-3 py-1 font-mono text-[11px] font-bold tracking-[0.18em] text-[#20B2AA]">
                    <Check className="size-3" strokeWidth={3} /> DISETUJUI ·
                    10:24
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    TRF-2024-0311 · TERCATAT OTOMATIS
                </span>
            </div>
        </div>
    );
}

function DisposalVisual() {
    const rows = [
        { t: 'Diajukan', d: '09:12 · AST-2023-1120', done: true },
        { t: 'Ditinjau manajer', d: '09:40 · komentar lengkap', done: true },
        { t: 'Disetujui', d: '10:05 · DSP-0092', done: true },
        { t: 'Eksekusi lelang', d: 'menunggu giliran', done: false },
    ];

    return (
        <div className="mx-auto w-full max-w-sm">
            {rows.map((row, i) => (
                <div key={row.t} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        {row.done ? (
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#20B2AA] text-white">
                                <Check className="size-3" strokeWidth={3} />
                            </span>
                        ) : (
                            <span className="pulse-dot flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-400 dark:border-slate-600">
                                <Clock className="size-3" />
                            </span>
                        )}
                        {i < rows.length - 1 && (
                            <span className="w-px flex-1 bg-slate-300 dark:bg-white/15" />
                        )}
                    </div>
                    <div className={i < rows.length - 1 ? 'pb-4' : ''}>
                        <div
                            className={`text-sm font-semibold ${row.done ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            {row.t}
                        </div>
                        <div className="font-mono text-[10px] tracking-wider text-slate-400 dark:text-slate-500">
                            {row.d}
                        </div>
                    </div>
                </div>
            ))}
            <p className="mt-3 text-center font-mono text-[9px] tracking-[0.18em] text-slate-400 dark:text-slate-500">
                JEJAK AUDIT TERKUNCI PER KEPUTUSAN
            </p>
        </div>
    );
}

function FeatureVisual({ code }: { code: string }) {
    switch (code) {
        case '01':
            return <DatabaseVisual />;
        case '02':
            return <ScanVisual />;
        case '03':
            return <TransferVisual />;
        default:
            return <DisposalVisual />;
    }
}

/* ------------------------------------------------------------------ */
/* FlowConnector                                                       */
/* ------------------------------------------------------------------ */

function FlowConnector({ color }: { color: string }) {
    return (
        <>
            <div
                className="relative hidden h-6 w-14 shrink-0 self-center md:block"
                aria-hidden
            >
                <span className="dash-line absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                <span
                    className="packet"
                    style={{
                        offsetPath: "path('M3 12 L53 12')",
                        background: color,
                        boxShadow: `0 0 10px ${color}`,
                    }}
                />
            </div>
            <div className="relative mx-auto h-9 w-6 md:hidden" aria-hidden>
                <span className="dash-line-v absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 text-slate-400 dark:text-slate-600" />
                <span
                    className="packet"
                    style={{
                        offsetPath: "path('M12 3 L12 33')",
                        background: color,
                        boxShadow: `0 0 10px ${color}`,
                    }}
                />
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* HierarchyExplorer                                                    */
/* ------------------------------------------------------------------ */

const HIERARCHY = [
    {
        id: 'golongan',
        name: 'Golongan',
        code: 'GOL',
        color: BLUE,
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
        color: IRIS,
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
        color: PINK,
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
        color: TEAL,
        desc: 'Tingkat paling detail — entitas aset yang sesungguhnya.',
        items: [
            { code: 'SUB-1111', name: 'Laptop', count: 214 },
            { code: 'SUB-1112', name: 'Workstation', count: 46 },
            { code: 'SUB-1113', name: 'Mini PC', count: 89 },
        ],
    },
];

export function HierarchyExplorer() {
    const [active, setActive] = useState(0);
    const level = HIERARCHY[active];
    const isLast = active >= HIERARCHY.length - 1;

    const drill = () => {
        if (!isLast) {
            setActive(active + 1);
        }
    };

    return (
        <div className={`${PANEL} overflow-hidden`}>
            <div className="grid lg:grid-cols-[260px_1fr]">
                <aside className="border-b border-slate-900/10 p-5 md:p-6 lg:border-r lg:border-b-0 dark:border-white/10">
                    <div className="font-mono text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                        STRUKTUR
                    </div>

                    <div className="relative mt-4">
                        <span
                            className="absolute top-4 bottom-4 left-[17px] w-px bg-gradient-to-b from-[#0080FF]/50 via-[#EC4B9E]/40 to-[#20B2AA]/50"
                            aria-hidden
                        />
                        <div className="space-y-1.5">
                            {HIERARCHY.map((lvl, i) => (
                                <button
                                    key={lvl.id}
                                    onClick={() => setActive(i)}
                                    aria-current={i === active}
                                    className={`relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none ${
                                        i === active
                                            ? 'bg-white/90 dark:bg-white/[0.12]'
                                            : 'hover:bg-white/60 dark:hover:bg-white/[0.06]'
                                    }`}
                                    style={
                                        i === active
                                            ? {
                                                  boxShadow: `0 10px 30px -14px ${lvl.color}80, inset 0 0 0 1px ${lvl.color}55`,
                                              }
                                            : undefined
                                    }
                                >
                                    <span
                                        className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold text-white"
                                        style={{ background: lvl.color }}
                                    >
                                        L{i + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-white">
                                            {lvl.name}
                                        </span>
                                        <span
                                            className="block font-mono text-[10px] font-bold tracking-wider"
                                            style={{ color: lvl.color }}
                                        >
                                            {lvl.code}
                                        </span>
                                    </span>
                                    {i === active && (
                                        <ChevronRight
                                            className="size-4 shrink-0"
                                            style={{ color: lvl.color }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                            <span>Kedalaman</span>
                            <span>L{active + 1}/4</span>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                            {HIERARCHY.map((lvl, i) => (
                                <span
                                    key={lvl.id}
                                    className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                                    style={{
                                        background:
                                            i <= active
                                                ? lvl.color
                                                : 'rgba(100,116,139,0.25)',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </aside>

                <div key={level.id} className="level-in p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase">
                        {HIERARCHY.slice(0, active + 1).map((lvl, i) => (
                            <Fragment key={lvl.id}>
                                {i > 0 && (
                                    <span className="text-slate-300 dark:text-slate-600">
                                        ▸
                                    </span>
                                )}
                                <span
                                    className="rounded-md border px-2 py-1"
                                    style={{
                                        borderColor: `${lvl.color}44`,
                                        color: lvl.color,
                                        background: `${lvl.color}14`,
                                    }}
                                >
                                    {lvl.code} · {lvl.name}
                                </span>
                            </Fragment>
                        ))}
                    </div>

                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        {level.desc}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {level.items.map((item) => (
                            <button
                                key={item.code}
                                onClick={drill}
                                disabled={isLast}
                                className="h-item group relative overflow-hidden rounded-xl border border-slate-900/10 bg-white/80 p-4 text-left backdrop-blur transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none disabled:cursor-default disabled:opacity-80 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-white/[0.06]"
                                style={cssVars({ '--band': level.color })}
                            >
                                <span
                                    className="absolute inset-y-0 left-0 w-[3px]"
                                    style={{
                                        background: level.color,
                                        opacity: 0.75,
                                    }}
                                    aria-hidden
                                />
                                <div
                                    className="font-mono text-[10px] font-bold tracking-wider"
                                    style={{ color: level.color }}
                                >
                                    {item.code}
                                </div>
                                <div className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                                    {item.name}
                                </div>
                                <div className="mt-1.5 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.count} entitas
                                    </span>
                                    {!isLast && (
                                        <span
                                            className="flex items-center gap-0.5 font-mono text-[9px] font-bold tracking-wider opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                            style={{ color: level.color }}
                                        >
                                            DRILL{' '}
                                            <ChevronRight className="size-3" />
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-900/10 pt-4 dark:border-white/10">
                        <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                            {isLast
                                ? 'LEVEL TERDALAM — ENTITAS ASET SESUNGGUHNYA'
                                : 'KLIK KARTU UNTUK MASUK LEBIH DALAM'}
                        </span>
                        <button
                            onClick={() => setActive(0)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none dark:text-slate-400 dark:hover:text-white"
                        >
                            <RotateCcw className="size-3" />
                            Mulai ulang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* AccessKeycard                                                       */
/* ------------------------------------------------------------------ */

export function AccessKeycard() {
    return (
        <div className="relative mx-auto w-full max-w-sm">
            <div
                className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#0080FF]/30 via-[#6971ec]/25 to-[#EC4B9E]/25 blur-2xl"
                aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/75 to-white/40 p-6 backdrop-blur-xl dark:border-white/15 dark:from-white/[0.12] dark:to-white/[0.04]">
                <span className="keycard-sheen" aria-hidden />

                <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0080FF] to-[#6971ec] text-white shadow-lg shadow-[#0080FF]/25">
                        <Fingerprint className="size-5" />
                    </span>
                    <span className="text-right font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        KARTU AKSES
                        <br />
                        SSO KORPORAT
                    </span>
                </div>

                <div className="mt-6 space-y-3">
                    {[
                        { k: 'PEMEGANG', v: 'anda@korporasi.co.id' },
                        { k: 'PERAN', v: 'Pengelola Aset' },
                        { k: 'ORGANISASI', v: 'PT Conto Nusantara' },
                    ].map((row) => (
                        <div
                            key={row.k}
                            className="flex items-center justify-between border-b border-slate-900/5 pb-2 last:border-0 dark:border-white/5"
                        >
                            <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                {row.k}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {row.v}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-900/95 p-3.5 text-white dark:bg-black/60">
                    <BarcodeStrip
                        scale={1.3}
                        barHeight={20}
                        withLaser={false}
                        className="text-white"
                    />
                    <span className="font-mono text-[9px] tracking-[0.18em] text-white/40">
                        ACC-2026-0847
                    </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider text-emerald-500">
                        <ShieldCheck className="size-3.5" /> TERENKRIPSI
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider text-[#0080FF]">
                        <Check className="size-3.5" strokeWidth={3} /> TANPA
                        PASSWORD
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Exported section components for lazy loading                        */
/* ------------------------------------------------------------------ */

const features = [
    {
        code: '01',
        title: 'Manajemen Data Aset',
        description:
            'Satu sumber data terpadu untuk seluruh aset perusahaan. Lacak detail, status, dan riwayat setiap item dari pengadaan hingga pemutihan.',
        color: BLUE,
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
        color: TEAL,
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
        color: IRIS,
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
        color: PINK,
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
        tag: 'STEP 01 · SCAN',
        description:
            'Arahkan kamera ke barcode aset. Identifikasi instan tanpa perlu mengetik apa pun ke dalam sistem.',
        color: TEAL,
        icon: ScanLine,
    },
    {
        title: 'Temukan Data',
        tag: 'STEP 02 · DATA',
        description:
            'Catatan lengkap langsung muncul: lokasi, departemen pemegang, status kelayakan, dan riwayat.',
        color: BLUE,
        icon: SearchCheck,
    },
    {
        title: 'Kelola & Eksekusi',
        tag: 'STEP 03 · ACTION',
        description:
            'Lanjutkan aksi — transfer, perawatan, atau disposisi — semua langsung tercatat dan diaudit otomatis.',
        color: IRIS,
        icon: ClipboardCheck,
    },
];

export function FeaturesSection() {
    return (
        <section id="fitur" className="section-gap scroll-mt-28">
            <div className="mb-14 max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <span
                        className="pulse-dot size-1.5 rounded-full"
                        style={{ background: BLUE }}
                    />
                    KEMAMPUAN INTI
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-[2.75rem] md:leading-[1.08]">
                    Siklus aset dikawal
                    <br />
                    <span className="text-slate-400 dark:text-slate-500">
                        dari ujung ke ujung.
                    </span>
                </h2>
                <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-400">
                    Empat modul bekerja sebagai satu alur — data terpusat,
                    pemindaian cepat, perpindahan tercatat, dan penghapusan yang
                    bisa dipertanggungjawabkan.
                </p>
            </div>

            <div className="space-y-6">
                {features.map((feature, i) => {
                    const Icon = feature.icon;
                    const flipped = i % 2 === 1;

                    return (
                        <article
                            key={feature.code}
                            className={`${PANEL} grid items-center gap-8 p-7 md:p-10 lg:grid-cols-2 lg:gap-14`}
                        >
                            <div
                                className={`relative ${flipped ? 'lg:order-2' : ''}`}
                            >
                                <span
                                    className="pointer-events-none absolute -top-12 -left-1 font-mono text-[6.5rem] leading-none font-bold text-slate-900/[0.05] select-none dark:text-white/[0.05]"
                                    aria-hidden
                                >
                                    {feature.code}
                                </span>

                                <div className="flex items-center gap-3">
                                    <span
                                        className="flex size-11 items-center justify-center rounded-xl text-white shadow-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}, ${feature.color}99)`,
                                            boxShadow: `0 10px 24px -8px ${feature.color}66`,
                                        }}
                                    >
                                        <Icon className="size-5" />
                                    </span>
                                    <span
                                        className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase"
                                        style={{ color: feature.color }}
                                    >
                                        MODUL {feature.code}
                                    </span>
                                </div>

                                <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                                    {feature.description}
                                </p>

                                <ul className="mt-6 space-y-2.5">
                                    {feature.ops.map((op) => (
                                        <li
                                            key={op}
                                            className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            <span
                                                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md"
                                                style={{
                                                    background: `${feature.color}1a`,
                                                    color: feature.color,
                                                }}
                                            >
                                                <Check
                                                    className="size-3"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                            {op}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div
                                className={`relative ${flipped ? 'lg:order-1' : ''}`}
                            >
                                <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-white/40 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                                    <div
                                        className="dotgrid absolute inset-0 opacity-50"
                                        aria-hidden
                                    />
                                    <div className="relative w-full">
                                        <FeatureVisual code={feature.code} />
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export function HierarchySection() {
    return (
        <section id="hirarki" className="section-gap scroll-mt-28 !pt-0">
            <div className="mb-12 max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <span
                        className="pulse-dot size-1.5 rounded-full"
                        style={{ background: IRIS }}
                    />
                    STRUKTUR KLASIFIKASI
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-[2.75rem] md:leading-[1.08]">
                    Empat level,
                    <br />
                    <span className="text-slate-400 dark:text-slate-500">
                        satu rantai keputusan.
                    </span>
                </h2>
                <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-400">
                    Setiap aset menempati satu titik pasti: Golongan ▸ Kategori
                    ▸ Cluster ▸ Sub Cluster. Jelajahi contoh datanya — klik
                    untuk masuk lebih dalam.
                </p>
            </div>
            <HierarchyExplorer />
        </section>
    );
}

export function StepsSection() {
    return (
        <section id="cara-kerja" className="section-gap scroll-mt-28 !pt-0">
            <div className="mb-12 max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <span
                        className="pulse-dot size-1.5 rounded-full"
                        style={{ background: TEAL }}
                    />
                    ALUR KERJA
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-[2.75rem] md:leading-[1.08]">
                    Dari lapangan ke laporan,
                    <br />
                    <span className="text-slate-400 dark:text-slate-500">
                        cukup tiga langkah.
                    </span>
                </h2>
            </div>

            <div className={`${PANEL} relative overflow-hidden p-7 md:p-10`}>
                <div
                    className="dotgrid absolute inset-0 opacity-40"
                    aria-hidden
                />
                <div className="relative flex flex-col md:flex-row md:items-stretch">
                    {steps.map((step, i) => {
                        const StepIcon = step.icon;

                        return (
                            <Fragment key={step.title}>
                                {i > 0 && <FlowConnector color={step.color} />}
                                <div
                                    className={`${CARD} relative flex-1 p-6 transition-transform duration-200 hover:-translate-y-1`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="flex size-11 items-center justify-center rounded-xl text-white shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`,
                                                boxShadow: `0 8px 20px -8px ${step.color}66`,
                                            }}
                                        >
                                            <StepIcon className="size-5" />
                                        </span>
                                        <span
                                            className="font-mono text-[9px] font-bold tracking-[0.18em]"
                                            style={{ color: step.color }}
                                        >
                                            {step.tag}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {step.description}
                                    </p>
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function CTASection({
    ctaHref,
    ctaLabel,
}: {
    ctaHref: string;
    ctaLabel: string;
}) {
    return (
        <section className="section-gap !pt-0 pb-20">
            <div className={`${PANEL} relative overflow-hidden`}>
                <div
                    className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#0080FF]/20 blur-[100px]"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-[#6971ec]/20 blur-[100px]"
                    aria-hidden
                />

                <div className="relative grid items-center gap-12 p-8 md:p-14 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                            <span
                                className="pulse-dot size-1.5 rounded-full"
                                style={{ background: PINK }}
                            />
                            AKSES INSTAN
                        </span>
                        <h2 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight md:text-[2.75rem]">
                            Satu pintu menuju
                            <br />
                            <span className="text-slate-400 dark:text-slate-500">
                                seluruh aset Anda.
                            </span>
                        </h2>
                        <p className="mt-5 max-w-md text-lg text-slate-600 dark:text-slate-400">
                            Gunakan akun SSO korporat Anda — tanpa password
                            tambahan — dan mulai kelola ribuan aset dalam
                            hitungan menit.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <a
                                href={ctaHref}
                                className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#0080FF] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-[#0080FF]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#006fdd] focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:translate-y-0 active:scale-95"
                            >
                                {ctaLabel}
                                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </a>
                            <a
                                href="#hirarki"
                                className="inline-flex items-center justify-center rounded-lg border border-slate-900/15 bg-white/50 px-7 py-4 text-sm font-semibold text-slate-700 backdrop-blur-xl transition-all duration-200 hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#0080FF]/50 focus-visible:outline-none active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                Lihat Hirarki
                            </a>
                        </div>
                        <p className="mt-6 font-mono text-[10px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500">
                            SSO KORPORAT · TANPA PASSWORD · JEJAK AUDIT
                        </p>
                    </div>

                    <AccessKeycard />
                </div>
            </div>
        </section>
    );
}
