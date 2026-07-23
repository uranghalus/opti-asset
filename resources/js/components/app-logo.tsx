import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            {/* Logo Icon Container */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20 ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10">
                <AppLogoIcon className="size-5 fill-current drop-shadow-sm" />
            </div>

            {/* Text Container */}
            <div className="ml-2 grid flex-1 text-left text-sm transition-opacity duration-200 group-hover:opacity-90">
                <span className="truncate font-bold tracking-tight text-foreground">
                    {name}
                </span>
                {/* Opsional: Buka komentar di bawah jika Anda ingin menambahkan subtitle */}
                {/* <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Workspaces
                </span> */}
            </div>
        </>
    );
}