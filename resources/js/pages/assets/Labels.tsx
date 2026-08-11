import { router, usePage } from '@inertiajs/react';
import { jsPDF } from 'jspdf';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import { useState } from 'react';
import { barcodeDataUrl } from '@/components/assets/barcode';
import {
    assetChainCode,
    assetTitle,
    Sticker,
} from '@/components/assets/label-sticker';
import type { LabelAsset } from '@/components/assets/label-sticker';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { index as indexRoute } from '@/routes/assets';

type PageProps = {
    assets: LabelAsset[];
};

export default function AssetLabels() {
    const { assets } = usePage().props as unknown as PageProps;
    const [exporting, setExporting] = useState(false);

    const printLabels = () => {
        if (assets.length === 0) {
            return;
        }

        window.print();
    };

    const exportPdf = async () => {
        if (assets.length === 0) {
            return;
        }

        setExporting(true);

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            const pageHeight = 297;
            const margin = 8;
            const labelWidth = 62;
            const labelHeight = 38;
            const cols = 3;
            const rowsPerPage = Math.floor(
                (pageHeight - margin * 2) / labelHeight,
            );

            for (let index = 0; index < assets.length; index++) {
                const asset = assets[index];
                const code = asset.kode_asset ?? asset.id;
                const chain = assetChainCode(asset);

                const dataUrl = await barcodeDataUrl(code);

                const col = index % cols;
                const rowInPage = Math.floor(index / cols) % rowsPerPage;

                if (index > 0 && rowInPage === 0 && col === 0) {
                    pdf.addPage();
                }

                const x = margin + col * (labelWidth + 4);
                const y = margin + rowInPage * labelHeight;

                pdf.setDrawColor(148, 163, 184);
                pdf.setLineWidth(0.3);
                pdf.setLineDashPattern([2, 2], 0);
                pdf.rect(x, y, labelWidth, labelHeight);

                pdf.setLineDashPattern([], 0);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.text(assetTitle(asset).slice(0, 60), x + 3, y + 5, {
                    maxWidth: labelWidth - 6,
                });

                pdf.setFontSize(6);
                pdf.setFont('helvetica', 'normal');

                if (chain) {
                    pdf.text(chain, x + 3, y + 9);
                }

                pdf.addImage(
                    dataUrl,
                    'PNG',
                    x + 3,
                    y + 9,
                    Math.min(labelWidth - 6, 52),
                    18,
                );

                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'bold');
                pdf.text(code, x + 3, y + 31);

                const meta = [
                    asset.serial_number ? `SN: ${asset.serial_number}` : null,
                    [asset.brand, asset.model].filter(Boolean).join(' · ') ||
                        null,
                ]
                    .filter(Boolean)
                    .join(' · ');

                if (meta) {
                    pdf.setFontSize(5.5);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(meta.slice(0, 70), x + 3, y + 35, {
                        maxWidth: labelWidth - 6,
                    });
                }
            }

            pdf.save('label-barcode-aset.pdf');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-white p-4 text-slate-900 md:p-8 print:bg-white print:p-0">
            <div className="mx-auto max-w-4xl print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => router.visit(indexRoute().url)}
                        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Daftar Aset
                    </button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={printLabels}
                            disabled={assets.length === 0}
                            className="gap-2 rounded-xl"
                        >
                            <Printer className="size-4" />
                            Cetak
                        </Button>
                        <Button
                            onClick={exportPdf}
                            disabled={exporting || assets.length === 0}
                            className="gap-2 rounded-xl"
                        >
                            {exporting ? (
                                <Spinner className="size-4" />
                            ) : (
                                <FileDown className="size-4" />
                            )}
                            {exporting ? 'Menyiapkan PDF...' : 'Export PDF'}
                        </Button>
                    </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                    {assets.length} label barcode dari pilihan Anda. Gunakan
                    tombol Cetak untuk mencetak, atau Export PDF untuk mengunduh
                    sebagai berkas PDF.
                </p>
            </div>

            <div className="mx-auto mt-6 max-w-4xl md:mt-8 print:mt-0 print:max-w-none">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
                    {assets.map((asset) => (
                        <Sticker key={asset.id} asset={asset} />
                    ))}
                </div>
            </div>
        </div>
    );
}
