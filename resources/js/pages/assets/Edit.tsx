import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Boxes } from 'lucide-react';
import { AssetForm } from '@/components/assets/asset-form';
import type { AssetInitial, AssetOption } from '@/components/assets/asset-form';
import { Button } from '@/components/ui/button';
import { assetListUrl } from '@/lib/asset-return';
import { index as indexRoute } from '@/routes/tenant/assets';

type EditProps = {
    asset: AssetInitial;
    items: AssetOption[];
    locations: { id: string; name: string }[];
    departments: { id_department: string; nama_department: string }[];
    employees: { id_employee: string; nama_employee: string }[];
    nextSequences: Record<string, number>;
};

export default function AssetEdit() {
    const props = usePage().props as unknown as EditProps;

    return (
        <>
            <Head title="Edit Aset" />

            <div className="relative flex min-h-[100dvh] flex-col bg-surface-base text-text-primary p-4 md:p-8">
                <div className="mx-auto w-full max-w-3xl">
                    <Link
                        href={assetListUrl()}
                        className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-text-tertiary transition-colors hover:text-text-primary"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Kembali ke Daftar Aset
                    </Link>

                    <header className="mt-5 rounded-xl border border-border-subtle bg-surface-card p-5 shadow-soft">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-surface-sunken text-text-tertiary">
                                <Boxes className="size-6" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-[-0.02em] text-text-primary">
                                    Edit Aset
                                </h1>
                                <p className="mt-1 font-mono text-[13px] font-semibold text-text-primary tabular-nums">
                                    {props.asset.kode_asset ?? 'â€”'}
                                </p>
                            </div>
                        </div>
                        <Button variant="soft-secondary" asChild>
                            <Link href={indexRoute()}>
                                Kembali ke Daftar
                            </Link>
                        </Button>
                    </header>

                    <div className="mt-4 rounded-xl border border-border-subtle bg-surface-card p-5 md:p-6">
                        <AssetForm
                            mode="edit"
                            asset={props.asset}
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

AssetEdit.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Aset',
            href: indexRoute().url,
        },
        {
            title: 'Edit Aset',
        },
    ],
};

