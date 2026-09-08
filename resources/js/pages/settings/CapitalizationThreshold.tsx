import { useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CapitalizationThreshold() {
    const { thresholds, activeThreshold } = usePage().props as any;
    const { data, setData, post, processing } = useForm({
        amount: activeThreshold?.amount || '',
        currency: activeThreshold?.currency || 'IDR',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.capitalization-threshold.store'));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ambang Batas Kapitalisasi</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Jumlah Ambang Batas</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={processing}>
                        Simpan Threshold
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
