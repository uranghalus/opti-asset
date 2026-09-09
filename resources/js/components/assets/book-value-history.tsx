import { format, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type BookValueSnapshot = {
    id: number;
    period_ends_at: string;
    book_value: string;
    accumulated_depreciation: string;
    notes?: string | null;
};

export function BookValueHistory({
    snapshots,
}: {
    snapshots: BookValueSnapshot[];
}) {
    if (!snapshots?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Nilai Buku</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Belum ada riwayat nilai buku untuk aset ini.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="size-4" />
                    <span>Riwayat Nilai Buku</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {snapshots.map((snapshot, index) => {
                        const prev = snapshots[index + 1];
                        const currentBV = parseFloat(snapshot.book_value);
                        const prevBV = prev
                            ? parseFloat(prev.book_value)
                            : currentBV;
                        const delta = currentBV - prevBV;
                        const isIncrease = delta > 0;
                        const isFirst = index === snapshots.length - 1;

                        return (
                            <div
                                key={snapshot.id}
                                className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                                        {isFirst ? (
                                            <Wallet className="size-3.5 text-primary" />
                                        ) : isIncrease ? (
                                            <TrendingUp className="size-3.5 text-green-400" />
                                        ) : (
                                            <TrendingDown className="size-3.5 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {format(
                                                parseISO(
                                                    snapshot.period_ends_at,
                                                ),
                                                'dd MMM yyyy',
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Akumulasi:{' '}
                                            {formatter.format(
                                                parseFloat(
                                                    snapshot.accumulated_depreciation,
                                                ),
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-semibold tabular-nums">
                                        {formatter.format(currentBV)}
                                    </p>
                                    {!isFirst && (
                                        <p
                                            className={`text-xs ${
                                                isIncrease
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                            }`}
                                        >
                                            {isIncrease ? '+' : '-'} Rp{' '}
                                            {formatter.format(Math.abs(delta))}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
