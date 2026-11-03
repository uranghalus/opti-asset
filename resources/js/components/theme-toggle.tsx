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

    const toggleTheme = () => {
        const next = resolvedAppearance === 'light' ? 'dark' : 'light';
        const toggleMode = () => updateAppearance(next);

        if (!(document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition) {
            toggleMode();
            return;
        }

        const transition = (
            document as Document & {
                startViewTransition: (cb: () => void) => { ready: Promise<void> };
            }
        ).startViewTransition(toggleMode);

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: ['inset(0 0 100% 0)', 'inset(0)'],
                },
                {
                    duration: 800,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)',
                },
            );
        });
    };

    if (!isMounted) {
        // Render nothing on the server to avoid hydration mismatch
        return null;
    }

    return (
        <div>
            {appearance === 'dark' || resolvedAppearance === 'dark' ? (
                <Button
                    variant="ghost"
                    className="h-10 w-10 hover:bg-primary/5 rounded-full cursor-pointer"
                    onClick={toggleTheme}
                    aria-label="Ganti Tema Terang"
                >
                    <Sun className="size-5" />
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    className="h-10 w-10 hover:bg-primary/5 rounded-full cursor-pointer"
                    onClick={toggleTheme}
                    aria-label="Ganti Tema Gelap"
                >
                    <Moon className="size-5" />
                </Button>
            )}
        </div>
    );
}
