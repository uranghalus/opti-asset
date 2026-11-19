import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeToggle() {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        // Placeholder ukuran tetap agar tidak ada layout shift saat mount
        return <div className="size-11 shrink-0" aria-hidden="true" />;
    }

    const isDark = appearance === 'dark' || resolvedAppearance === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 cursor-pointer rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Ganti Tema Terang' : 'Ganti Tema Gelap'}
        >
            {isDark ? (
                <Sun className="size-5" aria-hidden="true" />
            ) : (
                <Moon className="size-5" aria-hidden="true" />
            )}
        </Button>
    );
}
