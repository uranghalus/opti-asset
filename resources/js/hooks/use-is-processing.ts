import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function useIsProcessing(): boolean {
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const onStart = () => setProcessing(true);
        const onFinish = () => setProcessing(false);

        const unsubscribeStart = router.on('start', onStart);
        const unsubscribeFinish = router.on('finish', onFinish);

        return () => {
            unsubscribeStart();
            unsubscribeFinish();
        };
    }, []);

    return processing;
}
