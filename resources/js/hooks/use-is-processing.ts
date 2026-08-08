import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export function useIsProcessing(): boolean {
    const [processing, setProcessing] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const onStart = () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }

            timer.current = setTimeout(() => setProcessing(true), 300);
        };
        const onFinish = () => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }

            setProcessing(false);
        };

        const unsubscribeStart = router.on('start', onStart);
        const unsubscribeFinish = router.on('finish', onFinish);

        return () => {
            unsubscribeStart();
            unsubscribeFinish();

            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    return processing;
}
