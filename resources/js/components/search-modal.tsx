import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    Boxes,
    FileText,
    History,
    MapPin,
    Package,
    Plus,
    Search,
    Settings,
    Tag,
    User,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function SearchModal() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const quickActions = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: Package,
            description: 'Ringkasan aset dan aktivitas',
        },
        {
            title: 'Daftar Aset',
            url: '/assets',
            icon: Boxes,
            description: 'Kelola seluruh inventaris',
        },
        {
            title: 'Tambah Aset',
            url: '/assets/create',
            icon: Plus,
            description: 'Daftarkan aset baru',
        },
        {
            title: 'Mutasi Aset',
            url: '/asset-transfers',
            icon: History,
            description: 'Pindah aset antar lokasi',
        },
        {
            title: 'Lokasi',
            url: '/locations',
            icon: MapPin,
            description: 'Peta lokasi aset',
        },
        {
            title: 'Kategori',
            url: '/categories',
            icon: Tag,
            description: 'Pengelompokan aset',
        },
        {
            title: 'Pengguna',
            url: '/users',
            icon: User,
            description: 'Manajemen pengguna sistem',
        },
        {
            title: 'Pengaturan',
            url: '/settings/profile',
            icon: Settings,
            description: 'Preferensi dan akun',
        },
    ];

    const filteredActions = query.length > 0
        ? quickActions.filter(action =>
            action.title.toLowerCase().includes(query.toLowerCase()) ||
            action.description.toLowerCase().includes(query.toLowerCase())
          )
        : quickActions;

    const handleAction = (url: string) => {
        router.get(url);
        setOpen(false);
        setQuery('');
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-150"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline-flex text-[0.7rem]">Cari atau perintah...</span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border/50 bg-sidebar-accent/30 px-1.5 font-mono text-[0.6rem] font-medium text-sidebar-foreground/40">
                    <span className="text-xs">Ctrl</span>
                    <span>K</span>
                </kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md p-0 gap-0 bg-sidebar-card shadow-xl border-sidebar-border/50">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Cari aset, lokasi, atau aksi cepat</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center border-b border-sidebar-border/50 px-4 py-3">
                        <Search className="h-4 w-4 text-sidebar-foreground/40 mr-3 shrink-0" />
                        <Input
                            placeholder="Cari aset, lokasi, atau aksi cepat..."
                            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-sidebar-foreground/40 h-auto p-0"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {query.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setQuery('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                        <div className="text-xs font-medium text-sidebar-foreground/40 px-2 py-2 uppercase tracking-wide">
                            {query.length > 0 ? 'Hasil Pencarian' : 'Aksi Cepat'}
                        </div>
                        <div className="space-y-1">
                            {filteredActions.map((action) => (
                                <button
                                    key={action.title}
                                    onClick={() => handleAction(action.url)}
                                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-sidebar-accent/50 transition-colors duration-100 group"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 group-hover:bg-sidebar-primary/20 transition-colors duration-150">
                                        <action.icon className="h-4 w-4 text-sidebar-primary/70 group-hover:text-sidebar-primary transition-colors duration-150" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-sidebar-foreground truncate">
                                            {action.title}
                                        </div>
                                        <div className="text-xs text-sidebar-foreground/50 truncate">
                                            {action.description}
                                        </div>
                                    </div>
                                    <FileText className="h-4 w-4 text-sidebar-foreground/30 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-sidebar-border/50 px-4 py-2.5 bg-sidebar-accent/20">
                        <div className="flex items-center justify-between text-xs text-sidebar-foreground/40">
                            <span>Tekan Enter untuk pilih</span>
                            <span>Esc untuk menutup</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}