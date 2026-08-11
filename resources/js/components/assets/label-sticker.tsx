import { Tag } from 'lucide-react';
import { Barcode } from '@/components/assets/barcode';

export type LabelAsset = {
    id: string;
    kode_asset: string | null;
    serial_number: string | null;
    brand: string | null;
    model: string | null;
    item: { id: string; name: string; code: string } | null;
    asset_group: { id: string; code: string | null; name: string } | null;
    asset_category: { id: string; code: string | null; name: string } | null;
    asset_cluster: { id: string; code: string | null; name: string } | null;
    asset_sub_cluster: { id: string; code: string | null; name: string } | null;
};

export function assetTitle(asset: LabelAsset): string {
    return asset.item?.name ?? 'Aset';
}

export function assetChainCode(asset: LabelAsset): string {
    return [
        asset.asset_group,
        asset.asset_category,
        asset.asset_cluster,
        asset.asset_sub_cluster,
    ]
        .filter((level) => level && level.code)
        .map((level) => level?.code)
        .join('.');
}

export function Sticker({ asset }: { asset: LabelAsset }) {
    const code = asset.kode_asset ?? asset.id;
    const chain = assetChainCode(asset);

    return (
        <div className="flex h-full flex-col rounded-md border border-dashed border-slate-300 p-2 print:break-inside-avoid">
            <div className="flex items-start justify-between gap-1.5">
                <p className="line-clamp-2 min-w-0 text-[10px] leading-tight font-bold text-slate-800">
                    {assetTitle(asset)}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1 py-0.5 text-[8px] font-semibold text-slate-500 uppercase">
                    <Tag className="size-2" />
                    Aset
                </span>
            </div>

            <div className="mt-1">
                <Barcode value={code} className="h-9" />
            </div>

            <p className="mt-0.5 text-center font-mono text-[9px] font-bold tracking-wide text-slate-700">
                {code}
            </p>

            <div className="mt-auto flex items-end justify-between gap-1.5 border-t border-dashed border-slate-200 pt-1">
                <div className="min-w-0">
                    {chain ? (
                        <p className="truncate font-mono text-[8px] text-slate-500">
                            {chain}
                        </p>
                    ) : null}
                    <p className="truncate text-[8px] text-slate-500">
                        {[asset.brand, asset.model]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                    </p>
                </div>
                {asset.serial_number ? (
                    <p className="shrink-0 font-mono text-[8px] text-slate-500">
                        SN: {asset.serial_number}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
