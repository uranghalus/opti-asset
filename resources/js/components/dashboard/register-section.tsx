import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type RegisterSectionProps = {
    /** Judul section — dirender sebagai heading level 2 (urutan a11y). */
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Slot aksi di header (mis. Button "Lihat semua"). */
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    /** Id anchor untuk aria-describedby bila dibutuhkan. */
    headingId?: string;
};

/**
 * Pembungkus section dashboard: satu Card opaque (DESIGN.md — surface
 * putih, radius lg 12px, border 1px, tanpa resting shadow) berisi header +
 * konten. Semua blok dashboard memakai komponen ini supaya permukaan
 * seragam. Hover hanya menebalkan border — tanpa lift/shadow.
 *
 * Adaptasi: Card adalah `@container` supaya komponen di dalam (daftar
 * peringkat, feed aktivitas, antrean) bisa menyesuaikan pemotongan label
 * dengan lebar kolom sebenarnya (`@md:`, `@2xl:`), bukan lebar viewport.
 * Gaya print (break-inside-avoid) diatur bersama di `resources/css/app.css`.
 */
export function RegisterSection({
    title,
    description,
    icon: Icon,
    action,
    children,
    className,
    contentClassName,
    headingId,
}: RegisterSectionProps) {
    return (
        <Card
            className={cn(
                '@container gap-4 rounded-lg border-border p-0 transition-[border-color] duration-200',
                'contrast-more:border-border-strong',
                '[@media(hover:hover)]:hover:border-border-strong',
                'print:break-inside-avoid',
                className,
            )}
        >
            <CardHeader
                className={cn(
                    'flex-row items-start gap-3 px-4 pt-4 pb-0 sm:px-5 sm:pt-5',
                    action && 'justify-between',
                )}
            >
                <div className="flex min-w-0 items-start gap-3">
                    {Icon ? (
                        <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary-muted-border bg-primary-muted text-primary"
                        >
                            <Icon className="size-4.5" strokeWidth={2} />
                        </span>
                    ) : null}

                    <div className="min-w-0">
                        <CardTitle
                            id={headingId}
                            role="heading"
                            aria-level={2}
                            className="truncate text-[14px] font-semibold text-foreground"
                        >
                            {title}
                        </CardTitle>

                        {description ? (
                            <CardDescription className="mt-1 text-xs text-muted-foreground">
                                {description}
                            </CardDescription>
                        ) : null}
                    </div>
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </CardHeader>

            <CardContent
                className={cn('px-4 pb-4 sm:px-5 sm:pb-5', contentClassName)}
            >
                {children}
            </CardContent>
        </Card>
    );
}

/**
 * Tombol aksi tenant-aware: menjadi Button `asChild` + Inertia Link saat
 * `href` tersedia, dan versi disabled + Tooltip penjelasan saat tenant null
 * — tautan tidak pernah hilang diam-diam atau membentuk URL rusak.
 *
 * Adaptasi: Tooltip hanya pelengkap desktop; di layar sentuh alasan yang
 * sama tampil inline (`sm:hidden`) supaya tetap terjangkau tanpa hover.
 * Ukuran sentuh (min 44px) sudah dijamin variant Button (mobile-first).
 */
export function ActionButton({
    href,
    children,
    variant = 'ghost',
    size = 'sm',
    className,
}: {
    href?: string | null;
    children: React.ReactNode;
    variant?: React.ComponentProps<typeof Button>['variant'];
    size?: React.ComponentProps<typeof Button>['size'];
    className?: string;
}) {
    if (!href) {
        return (
            <span className="inline-flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex w-fit">
                            <Button
                                variant={variant}
                                size={size}
                                disabled
                                className={className}
                            >
                                {children}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        Pilih tenant aktif untuk membuka halaman ini.
                    </TooltipContent>
                </Tooltip>

                <span className="text-[12px] text-muted-foreground sm:hidden">
                    Pilih tenant aktif untuk membuka halaman ini.
                </span>
            </span>
        );
    }

    return (
        <Button
            asChild
            variant={variant}
            size={size}
            className={cn('group gap-1.5', className)}
        >
            <Link href={href}>
                {children}
                <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                />
            </Link>
        </Button>
    );
}

/** Placeholder memuat untuk section dashboard (fallback data belum siap). */
export function RegisterSectionSkeleton({
    rows = 4,
    className,
}: {
    rows?: number;
    className?: string;
}) {
    return (
        <Card
            className={cn(
                '@container gap-4 rounded-lg border-border p-0 print:hidden',
                className,
            )}
        >
            <CardHeader className="px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
                {Array.from({ length: rows }, (_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
            </CardContent>
        </Card>
    );
}