import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance  } from '@/hooks/use-appearance';
import type {Appearance} from '@/hooks/use-appearance';

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    const options: { value: Appearance; label: string; icon: React.ReactNode }[] = [
        {
            value: 'light',
            label: 'Light',
            icon: <Sun className="h-4 w-4" />,
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: <Moon className="h-4 w-4" />,
        },
        {
            value: 'system',
            label: 'System',
            icon: <Monitor className="h-4 w-4" />,
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/65 hover:bg-white/10 hover:text-white">
                    {appearance === 'dark' ? (
                        <Moon className="h-4 w-4" />
                    ) : appearance === 'light' ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Monitor className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => updateAppearance(option.value)}
                        className="flex items-center gap-2"
                    >
                        {option.icon}
                        <span>{option.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}