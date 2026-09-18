import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Boxes } from 'lucide-react';
import { AssetForm } from '@/components/assets/asset-form';
import type { AssetInitial, AssetOption } from '@/components/assets/asset-form';
import { VibrantBackground } from '@/components/vibrant-background';
import { assetListUrl } from '@/lib/asset-return';
import { index as indexRoute } from '@/routes/assets';

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

            <div className="noon dark relative flex min-h-[100dvh] flex-col bg-background p-4 text-foreground md:p-8">
                <VibrantBackground variant="default" />
                <div className="mx-auto w-full max-w-3xl">
                    <Link
                        href={assetListUrl()}
                        className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Kembali ke Daftar Aset
                    </Link>

                    <div className="glass-panel card-enter mt-5 flex items-center gap-3.5 rounded-xl p-5">
                        <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary shadow-md ring-1 ring-primary/10">
                            <Boxes className="size-6" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-[2rem] font-bold tracking-[-0.02em] text-foreground">
                                Edit Aset
                            </h1>
                            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                                {props.asset.kode_asset ?? '—'}
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel card-enter mt-4 rounded-xl p-5 delay-100 md:p-6">
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
