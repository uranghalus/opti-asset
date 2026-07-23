import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { ReactNode } from 'react';

export default function AppHeaderLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <AppShell variant="header">
            <AppHeader />
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
