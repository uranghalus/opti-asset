import { createInertiaApp } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'assets/Labels':
            case name === 'assets/LabelsBatch':
                return null;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                <ThemeInitializer />
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: 'oklch(0.52 0.15 245)',
        includeCSS: true,
        delay: 250,
    },
});

function ThemeInitializer() {
    useEffect(() => {
        initializeTheme();
    }, []);

    return null;
}
