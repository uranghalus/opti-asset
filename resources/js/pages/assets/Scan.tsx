import { router } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    ArrowLeft,
    Boxes,
    Camera,
    CircleAlert,
    Loader2,
    MapPin,
    Package,
    ScanLine,
    ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VibrantBackground } from '@/components/vibrant-background';
import { assetStatusChip, assetStatusLabel } from '@/lib/asset-status';
import { cn } from '@/lib/utils';
import {
    index as indexRoute,
    scanLookup,
    show as showRoute,
} from '@/routes/assets';

type Classification = {
    id: string;
    code: string | null;
    name: string;
};

type ScannedAsset = {
    id: string;
    kode_asset: string | null;
    status: string;
    condition: string | null;
    serial_number: string | null;
    photo_url: string[];
    item: { id: string; name: string; code: string } | null;
    location: { id: string; name: string } | null;
    department: { id_department: string; nama_department: string } | null;
    asset_group: Classification | null;
    asset_category: Classification | null;
    asset_cluster: Classification | null;
    asset_sub_cluster: Classification | null;
};

const SCANNER_ID = 'asset-scanner-region';

export default function AssetScan() {
    const [cameraActive, setCameraActive] = useState(false);
    const [startingCamera, setStartingCamera] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<ScannedAsset | null>(null);
    const [notFound, setNotFound] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [resultOpen, setResultOpen] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const stopCamera = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch {
                // scanner sudah berhenti
            }

            scannerRef.current.clear();
            scannerRef.current = null;
        }

        setCameraActive(false);
    }, []);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => undefined);
                scannerRef.current.clear();
            }
        };
    }, []);

    const lookup = useCallback(async (code: string) => {
        setSearching(true);
        setNotFound(null);

        try {
            const response = await fetch(scanLookup.url({ query: { code } }), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                const error = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };
                setNotFound(error.message ?? 'Aset tidak ditemukan.');
                setResult(null);

                return;
            }

            const payload = (await response.json()) as { asset: ScannedAsset };
            setResult(payload.asset);
            setResultOpen(true);
        } catch {
            setNotFound('Terjadi kesalahan saat mencari aset.');
            setResult(null);
        } finally {
            setSearching(false);
        }
    }, []);

    const startCamera = async () => {
        setStartingCamera(true);
        setCameraError(null);

        try {
            const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 260, height: 160 } },
                async (decodedText) => {
                    await stopCamera();
                    await lookup(decodedText.trim());
                },
                () => undefined,
            );

            setCameraActive(true);
        } catch {
            setCameraError(
                'Tidak dapat mengakses kamera. Periksa izin kamera atau gunakan mode manual.',
            );
            scannerRef.current?.clear();
            scannerRef.current = null;
        } finally {
            setStartingCamera(false);
        }
    };

    const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!manualCode.trim()) {
            return;
        }

        lookup(manualCode.trim());
    };

    const openDetail = () => {
        if (!result) {
            return;
        }

        setResultOpen(false);
        router.visit(showRoute(result.id).url);
    };

    const chain = result
        ? [
              result.asset_group,
              result.asset_category,
              result.asset_cluster,
              result.asset_sub_cluster,
          ]
              .filter(Boolean)
              .map((level) => level?.name)
              .join(' ▸ ')
        : '';

    return (
        <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
            <VibrantBackground variant="default" />
            <div className="mx-auto w-full max-w-3xl">
                <button
                    type="button"
                    onClick={() => router.visit(indexRoute().url)}
                    className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Kembali ke Daftar Aset
                </button>

                <div className="card-enter mt-5 flex items-center gap-4">
                    <div className="glass-card flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                        <ScanLine className="size-6" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Scan Aset
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Arahkan kamera ke barcode aset, atau masukkan kode
                            aset secara manual.
                        </p>
                    </div>
                </div>

                <div className="card-enter mt-6 space-y-4">
                    <div className="glass-panel relative overflow-hidden rounded-2xl p-4">
                        <div
                            id={SCANNER_ID}
                            className={cn(
                                'w-full overflow-hidden rounded-xl bg-black/5',
                                !cameraActive && 'min-h-[220px]',
                            )}
                        />

                        {!cameraActive && !startingCamera && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Camera
                                        className="size-6"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Kamera belum aktif
                                </p>
                                <Button
                                    onClick={startCamera}
                                    className="gap-2 rounded-xl"
                                >
                                    <Camera className="size-4" />
                                    Mulai Kamera
                                </Button>
                            </div>
                        )}

                        {startingCamera && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                        )}

                        {cameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="pointer-events-none size-[260px] rounded-2xl border-2 border-primary/60" />
                            </div>
                        )}

                        {cameraError && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                {cameraError}
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleManualSubmit}
                        className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row"
                    >
                        <div className="relative min-w-0 flex-1">
                            <Package className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={manualCode}
                                onChange={(event) =>
                                    setManualCode(event.target.value)
                                }
                                placeholder="Masukkan kode aset (mis. 01.01.01.001)"
                                className="h-11! pl-10 font-mono"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={searching || !manualCode.trim()}
                            className="h-11! gap-2 rounded-xl"
                        >
                            {searching ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Package className="size-4" />
                            )}
                            Cari
                        </Button>
                    </form>

                    {notFound && (
                        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" />
                            {notFound}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={resultOpen} onOpenChange={setResultOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Aset Ditemukan</DialogTitle>
                        <DialogDescription>
                            Hasil pemindaian kode aset.
                        </DialogDescription>
                    </DialogHeader>

                    {result && (
                        <div className="grid gap-4">
                            <button
                                type="button"
                                onClick={openDetail}
                                className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
                            >
                                {result.photo_url?.[0] ? (
                                    <img
                                        src={result.photo_url[0]}
                                        alt="Foto aset"
                                        className="size-12 shrink-0 rounded-xl border border-border/70 object-cover"
                                    />
                                ) : (
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary">
                                        <Boxes
                                            className="size-5"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {result.item?.name ?? 'Aset'}
                                    </p>
                                    <p className="mt-0.5 truncate font-mono text-xs font-bold text-primary tabular-nums">
                                        {result.kode_asset ?? '—'}
                                    </p>
                                    {chain ? (
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {chain}
                                        </p>
                                    ) : null}
                                </div>
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Status
                                    </p>
                                    <span
                                        className={cn(
                                            'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ring-1',
                                            assetStatusChip(result.status),
                                        )}
                                    >
                                        {assetStatusLabel(result.status)}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Kondisi
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-foreground">
                                        {result.condition ?? '—'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3">
                                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Lokasi
                                        </p>
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {result.location?.name ?? '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3">
                                    <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Serial
                                        </p>
                                        <p className="truncate font-mono text-sm font-semibold text-foreground">
                                            {result.serial_number ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setResultOpen(false)}
                        >
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            onClick={openDetail}
                            className="gap-2"
                        >
                            Lihat Detail
                            <ArrowLeft className="size-4 rotate-180" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
