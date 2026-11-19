import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Play } from 'lucide-react';

export default function DepreciationSettings() {
    const { processing, post } = useForm({});
    const { flash } = usePage().props as { flash?: { toast?: { type: string; message: string } } };

    const handleRun = () => {
        post(route('settings.depreciation.run'));
    };

    return (
        <AppLayout>
            <Head title="Depreciation" />
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">Depreciation</CardTitle>
                            <Badge variant="outline" className="gap-1.5">
                                <Calendar className="size-3.5" />
                                1 per bulan 02:00
                            </Badge>
                        </div>
                        <CardDescription className="pt-1">
                            Jalankan perhitungan penyusutan bulanan untuk semua aset aktif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Perhitungan mengikuti metode <span className="font-medium text-foreground">straight_line</span> dan
                            <span className="font-medium text-foreground"> declining_balance</span> dari layanan DepreciationCalculator.
                            Akumulasi dibatasi maksimum nilai perolehan.
                        </p>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleRun} disabled={processing} className="gap-2">
                                <Play className="size-4" />
                                {processing ? 'Menjalankan...' : 'Jalankan Penyusutan Sekarang'}
                            </Button>
                        </div>
                        {flash?.toast && (
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                                <Badge variant={flash.toast.type === 'success' ? 'default' : 'secondary'}>
                                    {flash.toast.type}
                                </Badge>
                                <span className="text-foreground/80">{flash.toast.message}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Jadwal Otomatis</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Command <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">app:run-depreciation</code> dijadwalkan tiap tanggal 1 pukul 02:00 dengan <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">withoutOverlapping</code>.
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}