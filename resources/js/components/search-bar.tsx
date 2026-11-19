import { Search } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { router, usePage } from '@inertiajs/react';
import { browse } from '@/routes/tenant/assets';
import { cn } from '@/lib/utils';

type PageProps = {
    tenant?: { code?: string } | null;
};

export function SearchBar({ className }: { className?: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const page = usePage().props as unknown as PageProps;
    const tenantCode = page.tenant?.code;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const value = inputRef.current?.value.trim();
        if (!value || !tenantCode) {
            return;
        }
        router.visit(
            browse.url({ tenant: tenantCode }, { query: { search: value } }),
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('min-w-48 max-w-[360px] flex-1', className)}
        >
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 transition-colors duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                <Search
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                />
                <input
                    ref={inputRef}
                    type="text"
                    name="search"
                    id="search-aset"
                    maxLength={100}
                    aria-label="Cari aset, kode, atau barcode"
                    placeholder="Cari aset, kode, atau barcode…"
                    className="w-full border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none"
                />
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
                    <span className="text-[11px]">⌘</span>K
                </kbd>
            </div>
        </form>
    );
}
