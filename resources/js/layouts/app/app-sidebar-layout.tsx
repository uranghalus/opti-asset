import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { MobileSidebarSheet } from '@/components/mobile-sidebar-sheet';

export default function AppSidebarLayout({
    children,
}: {
    children: ReactNode;
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (!mobile) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <AppShell variant="sidebar">
            {!isMobile && (
                <AppSidebar isMobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            )}
            <AppContent
                variant="sidebar"
                className="overflow-x-hidden bg-transparent pb-[56px] lg:pb-0"
            >
<AppSidebarHeader 
                    onMenuClick={() => setSidebarOpen(true)}
                />
                {children}
            </AppContent>
            {isMobile && (
                <>
                    <MobileBottomNav />
                    <MobileSidebarSheet
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                </>
            )}
        </AppShell>
    );
}