import { useRef, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { browse } from '@/routes/tenant/assets';

type PageProps = {
    tenant?: { code?: string } | null;
};

/**
 * Entry search untuk mobile: tombol ikon yang membuka dialog pencarian
 * (rute tujuan sama dengan SearchBar desktop).
 */
export function SearchDialog() {
    const inputRef = useRef<HTMLInputElement>(null);
    const page = usePage().props as unknown as PageProps;
    const tenantCode = page.tenant?.code;

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
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Cari aset"
                    className="size-11 shrink-0 cursor-pointer rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                >
                    <Search className="size-5" aria-hidden="true" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm p-4">
                <DialogTitle className="sr-only">Cari aset</DialogTitle>
                <DialogDescription className="sr-only">
                    Cari aset berdasarkan nama, kode, atau barcode
                </DialogDescription>
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div className="flex h-11 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                        <Search
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            autoFocus
                            maxLength={100}
                            aria-label="Cari aset, kode, atau barcode"
                            placeholder="Cari aset, kode, atau barcode…"
                            className="w-full border-none bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none"
                        />
                    </div>
                    <Button type="submit" className="h-11 shrink-0">
                        Cari
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
