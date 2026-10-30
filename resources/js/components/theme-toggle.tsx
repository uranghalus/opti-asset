import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    const options: {
        value: Appearance;
        label: string;
        icon: React.ReactNode;
    }[] = [
            {
                value: 'light',
                label: 'Terang',
                icon: <Sun className="size-3.5" />,
            },
            {
                value: 'dark',
                label: 'Gelap',
                icon: <Moon className="size-3.5" />,
            },
            {
                value: 'system',
                label: 'Sistem',
                icon: <Monitor className="size-3.5" />,
            },
        ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'group relative size-10 rounded-2xl transition-all duration-300',
                        'bg-slate-100/80 dark:bg-slate-800/60',
                        'border border-slate-200/80 dark:border-slate-700/50',
                        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)]',
                        'dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.3)]',
                        'hover:-translate-y-0.5 hover:border-[#2D82B7]/40 hover:bg-white dark:hover:bg-slate-800',
                        'hover:shadow-[0_6px_20px_-4px_rgba(45,130,183,0.25)]',
                        'data-[state=open]:border-[#2D82B7] data-[state=open]:bg-white dark:data-[state=open]:bg-slate-800',
                        'data-[state=open]:ring-4 data-[state=open]:ring-[#2D82B7]/15',
                        'data-[state=open]:shadow-[0_8px_24px_-4px_rgba(45,130,183,0.3)]'
                    )}
                >
                    <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D82B7]/20 to-[#2D82B7]/5 text-[#2D82B7] ring-1 ring-[#2D82B7]/20 transition-transform duration-300 group-hover:scale-110 dark:from-[#2D82B7]/30 dark:to-[#2D82B7]/10 dark:text-sky-300">
                        {appearance === 'dark' ? (
                            <Moon className="size-4" />
                        ) : appearance === 'light' ? (
                            <Sun className="size-4" />
                        ) : (
                            <Monitor className="size-4" />
                        )}
                    </div>
                    <span className="sr-only">Ganti Tema</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={cn(
                    'w-40 overflow-hidden rounded-2xl p-1.5 backdrop-blur-xl',
                    'border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95',
                    'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)]',
                    'dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]'
                )}
            >
                {options.map((option) => {
                    const isSelected = appearance === option.value;

                    return (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => updateAppearance(option.value)}
                            className={cn(
                                'my-0.5 flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
                                isSelected
                                    ? 'bg-gradient-to-r from-[#2D82B7] to-[#2571A1] text-white shadow-[0_4px_12px_rgba(45,130,183,0.35)]'
                                    : 'text-slate-700 hover:bg-slate-100 hover:translate-x-0.5 dark:text-slate-200 dark:hover:bg-slate-800/80'
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-lg transition-colors',
                                        isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                                    )}
                                >
                                    {option.icon}
                                </div>
                                <span>{option.label}</span>
                            </div>

                            {isSelected && (
                                <Check className="size-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}