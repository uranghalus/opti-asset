import { createInertiaApp, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import DashboardLayout from '@/layouts/app/dashboard-layout';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { setUrlDefaults } from '@/wayfinder';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Wayfinder tenant default URL parameter setup
let activeTenantCode: string | null = null;

try {
    const appEl = document.getElementById('app');

    if (appEl?.dataset.page) {
        const initialPage = JSON.parse(appEl.dataset.page);
        activeTenantCode = initialPage?.props?.tenant?.code ?? null;
    }
} catch {
    // ignore parsing failure
}

router.on('navigate', (event) => {
    const tenant = (event.detail.page.props as { tenant?: { code?: string } })
        ?.tenant?.code;

    if (tenant) {
        activeTenantCode = tenant;
    }
});

setUrlDefaults(() => {
    if (activeTenantCode) {
        return { tenant: activeTenantCode };
    }

    if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/([a-zA-Z0-9_-]+)/);

        if (
            match &&
            match[1] &&
            ![
                'login',
                'register',
                'forgot-password',
                'reset-password',
                'auth',
                'admin',
            ].includes(match[1])
        ) {
            return { tenant: match[1] };
        }
    }

    return {};
});

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
                return DashboardLayout;
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
