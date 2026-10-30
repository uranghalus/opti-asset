import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar({ className }: { className?: string }) {
    return (
        <div className={cn('ml-4 min-w-50 flex-1 md:min-w-62.5 lg:ml-6', className)}>
            <div
                className={cn(
                    'group relative flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-300',
                    // Soft UI Inset Surface Base
                    'bg-slate-100/80 dark:bg-slate-800/60',
                    'border border-slate-200/80 dark:border-slate-700/50',
                    'shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.8)]',
                    'dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.05)]',
                    // Interactive Focus Ring & Soft Glow Halo
                    'focus-within:border-[#2D82B7] focus-within:bg-white dark:focus-within:bg-slate-800',
                    'focus-within:ring-4 focus-within:ring-[#2D82B7]/15',
                    'focus-within:shadow-[0_8px_20px_-4px_rgba(45,130,183,0.25)]'
                )}
            >
                {/* Soft UI Icon Container */}
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-400 transition-colors duration-200 group-focus-within:bg-[#2D82B7]/15 group-focus-within:text-[#2D82B7] dark:bg-slate-700/50 dark:text-slate-500 dark:group-focus-within:text-sky-300">
                    <Search className="size-3.5 transition-transform duration-200 group-focus-within:scale-110" />
                </div>

                {/* Input Text Field */}
                <input
                    type="text"
                    placeholder="Cari aset, kode, atau barcode…"
                    className="w-full border-none bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />

                {/* Soft Elevated KBD Badge */}
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/90 bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)] backdrop-blur-md md:flex dark:border-slate-700 dark:bg-slate-700/80 dark:text-slate-300 dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                    <span className="text-[11px]">⌘</span>K
                </kbd>
            </div>
        </div>
    );
}