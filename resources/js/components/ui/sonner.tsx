import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            gap={10}
            visibleToasts={3}
            duration={4500}
            toastOptions={{
                classNames: {
                    toast: 'premium-toast',
                    title: 'premium-toast-title',
                    description: 'premium-toast-description',
                    actionButton: 'premium-toast-action',
                    cancelButton: 'premium-toast-cancel',
                    closeButton: 'premium-toast-close',
                },
                style: {
                    '--normal-text': 'var(--foreground)',
                } as React.CSSProperties,
            }}
            {...props}
        />
    );
}

export { Toaster };
