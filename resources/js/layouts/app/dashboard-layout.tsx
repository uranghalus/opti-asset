import type { ReactNode } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { DashboardLayoutHeader } from '@/components/dashboard-layout-header';
import { AppSidebar } from '@/components/shadcn-dashboard/blocks/dashboard-layout/dashboard-layout-01/app-sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="overflow-x-hidden bg-transparent"
            >
                <DashboardLayoutHeader />
                {children}
            </AppContent>
        </AppShell>
    );
}
