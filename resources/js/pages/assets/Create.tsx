import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Boxes } from 'lucide-react';
import { AssetForm } from '@/components/assets/asset-form';
import type { AssetOption } from '@/components/assets/asset-form';
import { VibrantBackground } from '@/components/vibrant-background';
import { assetListUrl } from '@/lib/asset-return';
import { index as indexRoute } from '@/routes/assets';

type CreateProps = {
    items: AssetOption[];
    locations: { id: string; name: string }[];
    departments: { id_department: string; nama_department: string }[];
    employees: { id_employee: string; nama_employee: string }[];
    nextSequences: Record<string, number>;
};

export default function AssetCreate() {
    const props = usePage().props as unknown as CreateProps;

    return (
        <>
            <Head title="Tambah Aset" />

            <div className="relative flex min-h-[100dvh] flex-col p-4 md:p-8">
                <VibrantBackground variant="default" />
                <div className="mx-auto w-full max-w-4xl">
                    <Link
                        href={assetListUrl()}
                        className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Kembali ke Daftar Aset
                    </Link>

                    <div className="glass-panel card-enter mt-5 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="glass-card flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary shadow-md ring-1 ring-primary/10">
                                <Boxes className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Tambah Aset
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Pilih item untuk membuat kode aset otomatis,
                                    lalu lengkapi data aset.
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                            <Boxes className="size-3.5" strokeWidth={2} />
                            Kode dibuat otomatis
                        </span>
                    </div>

                    <div className="glass-panel card-enter mt-4 rounded-2xl p-5 delay-100 md:p-7">
                        <AssetForm
                            mode="create"
                            items={props.items}
                            locations={props.locations}
                            departments={props.departments}
                            employees={props.employees}
                            nextSequences={props.nextSequences}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

AssetCreate.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Aset',
            href: indexRoute().url,
        },
        {
            title: 'Tambah Aset',
        },
    ],
};
