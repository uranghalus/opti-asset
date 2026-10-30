import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Boxes } from 'lucide-react';
import { AssetForm } from '@/components/assets/asset-form';
import type { AssetOption } from '@/components/assets/asset-form';
import { assetListUrl } from '@/lib/asset-return';
import { index as indexRoute } from '@/routes/tenant/assets';

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

            <div className="relative flex min-h-[100dvh] flex-col bg-surface-base text-text-primary p-4 md:p-8">
                <div className="mx-auto w-full max-w-4xl">
                    <Link
                        href={assetListUrl()}
                        className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-text-tertiary transition-colors hover:text-text-primary"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Kembali ke Daftar Aset
                    </Link>

                    <header className="mt-5 flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-text-tertiary">
                                <Boxes className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-[-0.02em] text-text-primary">
                                    Tambah Aset
                                </h1>
                                <p className="mt-1 text-sm text-text-tertiary">
                                    Pilih item untuk membuat kode aset otomatis,
                                    lalu lengkapi data aset.
                                </p>
                            </div>
                        </div>
                        <span className="border-brand-subtle bg-brand-subtle mt-3 inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm border px-3.5 py-1.5 text-xs font-semibold text-brand sm:mt-0">
                            <Boxes className="size-3.5" strokeWidth={2} />
                            Kode dibuat otomatis
                        </span>
                    </header>

                    <div className="mt-4 rounded-xl border border-border-subtle bg-surface-card p-5 md:p-7">
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

