import { usePage } from '@inertiajs/react';
import { CircleAlert, FileDown, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type ImportReportError = {
    row: number;
    message: string;
};

export type ImportReport = {
    imported: number;
    skipped: number;
    total_errors: number;
    errors: ImportReportError[];
};

/**
 * Panel hasil impor — daftar lengkap baris yang dilewati dan master data
 * yang gagal dicocokkan (department, klasifikasi). Diisi dari flash data
 * `import_report` dan otomatis hilang setelah navigasi berikutnya.
 */
export function ImportResultPanel() {
    const { flash } = usePage() as unknown as {
        flash?: Record<string, unknown>;
    };
    const report = flash?.import_report as ImportReport | undefined;
    const [dismissedReport, setDismissedReport] = useState<unknown>(null);

    // Reference equality: a fresh import flashes a fresh report object, so a
    // dismissal of a previous report never suppresses the next one.
    if (dismissedReport === report) {
        return null;
    }

    if (!report || (report.imported === 0 && report.skipped === 0)) {
        return null;
    }

    const hasErrors = report.errors.length > 0;
    const remaining =
        report.total_errors > report.errors.length
            ? report.total_errors - report.errors.length
            : 0;

    return (
        <div
            role="region"
            aria-label="Hasil impor aset"
            className={cn(
                'rounded-xl border p-4 backdrop-blur-lg',
                hasErrors
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-emerald-500/30 bg-emerald-500/10',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                        Lampiran manifest
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                        Hasil impor — {report.imported} pos tercatat
                        {report.skipped > 0 &&
                            `, ${report.skipped} baris dilewati`}
                        {hasErrors && `, ${report.total_errors} catatan`}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissedReport(report)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    aria-label="Tutup laporan impor"
                >
                    <X className="size-4" />
                </button>
            </div>

            {hasErrors && (
                <ol className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                    {report.errors.map((error, index) => (
                        <li
                            key={`${error.row}-${index}`}
                            className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90"
                        >
                            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                                {error.row > 0 && (
                                    <span className="mr-1.5 font-mono font-bold text-muted-foreground">
                                        Baris {error.row}:
                                    </span>
                                )}
                                {error.message}
                            </span>
                        </li>
                    ))}
                </ol>
            )}

            {remaining > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileDown className="size-3.5" />
                    {remaining} catatan lainnya tidak ditampilkan.
                </p>
            )}
        </div>
    );
}
