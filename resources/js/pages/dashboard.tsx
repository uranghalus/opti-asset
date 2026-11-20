import { Head, usePage } from '@inertiajs/react';
import { MapPin, Tags } from 'lucide-react';
import { ActivityLedger } from '@/components/dashboard/activity-ledger';
import { ApprovalQueue } from '@/components/dashboard/approval-queue';
import { RankedList } from '@/components/dashboard/ranked-list';
import { RegisterMasthead } from '@/components/dashboard/register-masthead';
import { RegisterSection } from '@/components/dashboard/register-section';
import { RegisterStrip } from '@/components/dashboard/register-strip';
import type { DashboardPageProps } from '@/components/dashboard/register-types';
import { StatusLedger } from '@/components/dashboard/status-ledger';
import { WarrantyWatch } from '@/components/dashboard/warranty-watch';
import { dashboard } from '@/routes/tenant';
import { index as transfersIndex } from '@/routes/tenant/asset-transfers';
import { index as assetsIndex } from '@/routes/tenant/assets';
import { index as disposalsIndex } from '@/routes/tenant/disposals';

/**
 * Dashboard Operate-mode "Stripe-tinged": masthead bergaya mesh-lembut
 * dengan angka hero total aset + skor integritas, strip KPI terkait
 * pekerjaan (urut urgensi), lalu ledger: donut status (resep LOCKED),
 * bar nilai per tipe, peringkat klasifikasi & lokasi, feed aktivitas
 * ber-tab, antrean persetujuan yang benar-benar bisa diproses, dan
 * pemantau garansi.
 *
 * Kontrak data tidak berubah: `stats`, `asset_by_classification`,
 * `asset_by_type`, `asset_by_location`, `recent_transfers`,
 * `recent_disposals`, `integrity_score`, `warranty_alerts` — sama dengan
 * payload `DashboardController`. Semua angka tampil apa adanya dari
 * props; tidak ada sparkline/trend yang dikarang. Prop yang null/array
 * kosong jatuh ke empty state atau skeleton, bukan error.
 *
 * -------------------------------------------------------------------
 * Strategi adaptasi (bukan desktop yang diperkecil — tiap konteks punya
 * tata letak & interaksi sendiri; identitas visual Stripe-style tetap):
 *
 * - Mobile (<768): urutan prioritas — masthead (total aset) → strip KPI
 *   (carousel scroll-snap) → ApprovalQueue → chart → peringkat →
 *   aktivitas, diatur lewat kelas `order-*` (bukan urutan DOM desktop).
 *   Section peringkat diringkas 5 item; sisanya lewat Sheet "Lihat
 *   semua". Lebar konten dibatasi `max-w-[1440px]` dan dipusatkan agar
 *   tetap rapi di layar lebar; padding aman notch/home-indicator lewat
 *   `env(safe-area-inset-*)`; tanpa overflow horizontal.
 * - Tablet (768–1023): grid 2 kolom untuk section peringkat; chart
 *   tampil full-width (masih enak dibaca & disentuh) sebelum split
 *   2/5–3/5 di lg.
 * - Desktop (≥1024) & layar lebar: grid multi-kolom seperti sebelumnya,
 *   terpusat di `max-w-[1440px]`; hover/Tooltip/pintasan keyboard jadi
 *   pelengkap (kepadatan informasi lebih tinggi).
 * - Layar pendek: tidak ada elemen sticky tinggi; strip KPI kompak.
 * - Print/ekspor PDF: palet light dipaksa (token dioverride), shell
 *   aplikasi & elemen interaktif disembunyikan, Card & chart dipotong
 *   di batas logis (`break-inside-avoid`), ScrollArea tidak memotong
 *   daftar — detail gaya ada di `resources/css/app.css` (@media print,
 *   scoped `body:has([data-print-scope="dashboard"])`) dan utilitas
 *   `print:` di masing-masing komponen `@/components/dashboard/*`.
 * -------------------------------------------------------------------
 */
export default function Dashboard() {
    const pageProps = usePage().props as unknown as Partial<DashboardPageProps>;

    const stats = pageProps.stats;
    const classifications = pageProps.asset_by_classification ?? [];
    const locations = pageProps.asset_by_location ?? [];
    const typeSlices = pageProps.asset_by_type ?? [];
    const transfers = pageProps.recent_transfers ?? [];
    const disposals = pageProps.recent_disposals ?? [];
    const integrityScore = pageProps.integrity_score;
    const warranty = pageProps.warranty_alerts;

    const tenantCode = pageProps.tenant?.code ?? null;
    const tenantName = pageProps.tenant?.name ?? null;

    /** Href Wayfinder; null saat tenant tidak aktif (aksi dinonaktifkan). */
    const hrefFor = (route: (args: { tenant: string }) => { url: string }) =>
        tenantCode ? route({ tenant: tenantCode }).url : null;

    const hrefs = {
        assets: hrefFor(assetsIndex),
        transfers: hrefFor(transfersIndex),
        disposals: hrefFor(disposalsIndex),
    };

    return (
        <>
            <Head title="Dashboard" />

            <div
                data-print-scope="dashboard"
                className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:gap-5 md:p-6 md:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
                <RegisterMasthead
                    stats={stats}
                    integrityScore={integrityScore}
                    tenantName={tenantName}
                    hrefs={hrefs}
                />

                <RegisterStrip
                    stats={stats}
                    warranty={warranty}
                    hrefs={hrefs}
                />

                {/* Urutan mobile = prioritas: antrean persetujuan mendahului
                    chart. Di desktop (lg) urutan kembali ke alur baca alami:
                    chart → peringkat → aktivitas → antrean. */}
                <ApprovalQueue
                    transfers={transfers}
                    disposals={disposals}
                    tenantCode={tenantCode}
                    hrefs={hrefs}
                    className="order-3 lg:order-6"
                />

                <div className="order-4 grid gap-4 md:gap-5 lg:order-3 lg:grid-cols-5">
                    <StatusLedger stats={stats} className="lg:col-span-5" />
                </div>

                <div className="order-5 grid gap-4 md:grid-cols-1 md:gap-5 lg:order-4">
                    <RegisterSection
                        title="Aset per Klasifikasi"
                        description="Golongan dengan jumlah aset terbanyak"
                        icon={Tags}
                    >
                        <RankedList
                            items={classifications.map((slice) => ({
                                label: slice.name ?? '—',
                                value: Number(slice.count) || 0,
                                meta: slice.tipe ?? null,
                            }))}
                            mobileLimit={5}
                            allTitle="Semua Klasifikasi"
                            allDescription="Seluruh golongan beserta jumlah aset tercatat."
                            emptyTitle="Belum ada klasifikasi berisi"
                            emptyDescription="Aset yang sudah dikelompokkan ke golongan akan muncul di sini."
                        />
                    </RegisterSection>
                </div>

                <div className="order-6 grid gap-4 md:gap-5 lg:order-5 lg:grid-cols-3">
                    <ActivityLedger
                        transfers={transfers}
                        disposals={disposals}
                        className="lg:col-span-2"
                    />

                    <WarrantyWatch alerts={warranty} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { tenant?: { code: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.tenant?.code
                ? dashboard({ tenant: props.tenant.code }).url
                : '/',
        },
    ],
});
