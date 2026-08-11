import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function Barcode({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, value, {
                format: 'CODE128',
                displayValue: false,
                width: 1.5,
                height: 48,
                margin: 4,
            });
        }
    }, [value]);

    return (
        <svg
            ref={svgRef}
            className={cn('w-full', className)}
            aria-label={`Barcode ${value}`}
        />
    );
}

export function barcodeDataUrl(value: string): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value, {
            format: 'CODE128',
            displayValue: false,
            width: 2,
            height: 60,
            margin: 6,
        });
        resolve(canvas.toDataURL('image/png'));
    });
}
