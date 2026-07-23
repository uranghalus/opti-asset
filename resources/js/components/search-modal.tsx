import { router } from '@inertiajs/react';
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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function SearchModal() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const quickActions = [
        { title: 'Dashboard', url: '/dashboard', icon: Package, description: 'Ringkasan aset dan aktivitas' },
        { title: 'Daftar Aset', url: '/assets', icon: Boxes, description: 'Kelola seluruh inventaris' },
        { title: 'Tambah Aset', url: '/assets/create', icon: Plus, description: 'Daftarkan aset baru' },
        { title: 'Mutasi Aset', url: '/asset-transfers', icon: History, description: 'Pindah aset antar lokasi' },
        { title: 'Lokasi', url: '/locations', icon: MapPin, description: 'Peta lokasi aset' },
        { title: 'Kategori', url: '/categories', icon: Tag, description: 'Pengelompokan aset' },
        { title: 'Pengguna', url: '/users', icon: User, description: 'Manajemen pengguna sistem' },
        { title: 'Pengaturan', url: '/settings/profile', icon: Settings, description: 'Preferensi dan akun' },
    ];

    const filteredActions =
        query.length > 0
            ? quickActions.filter(
                  (action) =>
                      action.title.toLowerCase().includes(query.toLowerCase()) ||
                      action.description.toLowerCase().includes(query.toLowerCase()),
              )
            : quickActions;

    const handleAction = (url: string) => {
        router.get(url);
        setOpen(false);
        setQuery('');
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-[#D5D9DC] bg-[#F7F8F9] px-3 text-left text-[13px] text-[#86888C] transition-colors hover:border-[#006FCF]/40 hover:bg-white dark:border-[#1e293b] dark:bg-white/[0.04] dark:text-[#B7C3D9] dark:hover:border-[#006FCF]/40 dark:hover:bg-white/[0.06]"
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1">Cari aset, lokasi, atau aksi cepat...</span>
                <kbd className="hidden items-center gap-0.5 rounded border border-[#D5D9DC] bg-white px-1.5 font-mono text-[10px] text-[#86888C] sm:inline-flex dark:border-[#1e293b] dark:bg-white/[0.04]">
                    Ctrl K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md rounded-xl border border-[#D5D9DC] bg-white p-0 shadow-2xl dark:border-[#1e293b] dark:bg-[#0f172a]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Cari aset, lokasi, atau aksi cepat</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center border-b border-[#D5D9DC] px-4 py-3 dark:border-[#1e293b]">
                        <Search className="h-4 w-4 shrink-0 text-[#86888C] mr-3" />
                        <Input
                            placeholder="Cari aset, lokasi, atau aksi cepat..."
                            className="flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
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
                        <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[#86888C]">
                            {query.length > 0 ? 'Hasil Pencarian' : 'Aksi Cepat'}
                        </div>
                        <div className="space-y-0.5">
                            {filteredActions.map((action) => (
                                <button
                                    key={action.title}
                                    onClick={() => handleAction(action.url)}
                                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[#F7F8F9] dark:hover:bg-white/[0.04]"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#006FCF]/[0.08] group-hover:bg-[#006FCF]/[0.14] transition-colors">
                                        <action.icon className="h-4 w-4 text-[#006FCF]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-[#1A1A1A] dark:text-white truncate">{action.title}</div>
                                        <div className="text-xs text-[#86888C] truncate">{action.description}</div>
                                    </div>
                                    <FileText className="h-4 w-4 shrink-0 text-[#86888C]/50" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-[#D5D9DC] px-4 py-2.5 dark:border-[#1e293b]">
                        <div className="flex items-center justify-between text-xs text-[#86888C]">
                            <span>Tekan Enter untuk pilih</span>
                            <span>Esc untuk menutup</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
