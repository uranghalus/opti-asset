import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            {/* Logo Icon Container */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-primary/20">
                <AppLogoIcon className="size-5 fill-current" />
            </div>

            {/* Text Container */}
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate font-bold tracking-tight text-foreground">
                    {name}
                </span>
            </div>
        </>
    );
}
