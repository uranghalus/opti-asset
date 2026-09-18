import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

interface ResourcePaginationProps {
    links: PaginationLink[];
    currentPage: number;
    lastPage: number;
    from: number | null;
    to: number | null;
    total: number;
    onPageChange: (url: string | null) => void;
}

export function ResourcePagination({
    links,
    currentPage,
    lastPage,
    from,
    to,
    total,
    onPageChange,
}: ResourcePaginationProps) {
    return (
        <div className="card-enter mt-6 flex items-center justify-between gap-3 delay-200">
            <p className="text-xs text-muted-foreground tabular-nums">
                <span className="hidden sm:inline">Menampilkan </span>
                {from}–{to}
                <span className="hidden sm:inline"> dari </span>
                <span className="sm:hidden"> / </span>
                {total}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-xl sm:size-9"
                    disabled={!links[0]?.url}
                    onClick={() => onPageChange(links[0]?.url)}
                    aria-label="Halaman sebelumnya"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-14 text-center text-sm font-semibold text-foreground tabular-nums">
                    {currentPage}
                    <span className="text-muted-foreground"> /{lastPage}</span>
                </span>
                <div className="hidden items-center gap-1 sm:flex">
                    {links.slice(1, -1).map((link, i) => (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="icon"
                            className={cn(
                                'h-9 w-9 rounded-xl',
                                !link.active && 'hidden lg:inline-flex',
                            )}
                            disabled={!link.url}
                            onClick={() => onPageChange(link.url)}
                        >
                            {link.label}
                        </Button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-xl sm:size-9"
                    disabled={!links[links.length - 1]?.url}
                    onClick={() => onPageChange(links[links.length - 1]?.url)}
                    aria-label="Halaman berikutnya"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
