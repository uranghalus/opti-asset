import { PanelLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SearchBar } from './search-bar';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';
import { TenantSelector } from './tenant-selector';

export function AppSidebarHeader() {
    const { toggleSidebar } = useSidebar();

    return (
        <header
            className={cn('sticky top-0 z-2 bg-background border-b border-border')}
        >
            <nav>
                <div className="mx-auto flex flex-wrap items-center justify-between p-2">
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="p-2 hover:bg-primary/5 rounded-full transition cursor-pointer"
                            onClick={toggleSidebar}
                            aria-label="Buka menu navigasi"
                        >
                            <PanelLeft size={21} />
                        </Button>

                        <Separator
                            orientation="vertical"
                            className="h-4 mr-4 w-px ml-2 bg-border self-center max-lg:hidden"
                        />

                        <div className="sm:block hidden">
                            <SearchBar />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <TenantSelector />
                        <ThemeToggle />
                        <NotificationBell />
                    </div>
                </div>
            </nav>
        </header>
    );
}
