import {
    LayoutDashboard,
    Package,
    Boxes,
    Tags,
    MapPin,
    Move,
    History,
    UserCircle,
    Sliders,
    Upload,
    ArchiveX,
    Building2,
    Network,
    Layers,
    ShieldCheck,
    KeyRound,
    User,
} from 'lucide-react';

import type { SidebarData } from '@/types/navigation';

export const sidebarData: SidebarData = {
    teams: [
        {
            name: 'DutaAsset',
            logo: Package,
            plan: 'v1.0.0',
        },
    ],

    navGroups: [
        // ---------- UMUM ----------
        {
            title: 'Umum',
            items: [
                {
                    title: 'Dashboard',
                    url: '/dashboard',
                    icon: LayoutDashboard,
                },
            ],
        },

        // ---------- MANAJEMEN ASET ----------
        {
            title: 'Manajemen Aset',
            items: [
                {
                    title: 'Daftar Aset',
                    url: '/assets',
                    icon: Boxes,
                    permission: {
                        resource: 'asset',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Klasifikasi Aset',
                    url: '/asset-classification',
                    icon: Tags,
                    permission: {
                        resource: 'asset.classification',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Master Item',
                    url: '/items',
                    icon: Package,
                    permission: {
                        resource: 'inventory',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Kategori',
                    url: '/categories',
                    icon: Tags,
                    permission: {
                        resource: 'asset.category',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Lokasi',
                    url: '/locations',
                    icon: MapPin,
                    permission: {
                        resource: 'asset.location',
                        actions: ['view'],
                    },
                },

                {
                    title: 'Mutasi Aset',
                    url: '/asset-transfers',
                    icon: Move,
                    permission: {
                        resource: 'asset.transfer',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Penghapusan Aset',
                    url: '/asset-disposals',
                    icon: ArchiveX,
                    permission: {
                        resource: 'asset',
                        actions: ['delete'],
                    },
                },
                {
                    title: 'Audit Log',
                    url: '/audit-logs',
                    icon: History,
                    permission: {
                        resource: 'audit.log',
                        actions: ['view'],
                    },
                },
            ],
        },

        // // ---------- INVENTORY ----------
        // {
        //   title: 'Persediaan',
        //   items: [
        //     {
        //       title: 'Stok Barang',
        //       url: '/stocks',
        //       icon: Warehouse,
        //       permission: {
        //         resource: 'inventory',
        //         actions: ['view'],
        //       },
        //     },
        //     {
        //       title: 'Transaksi Stok',
        //       url: '/stock-transactions',
        //       icon: ClipboardList,
        //       permission: {
        //         resource: 'inventory',
        //         actions: ['view'],
        //       },
        //     },
        //   ],
        // },

        // // // ---------- OPERASIONAL ----------
        // {
        //   title: 'Operasional',
        //   items: [
        //     {
        //       title: 'Peminjaman Aset',
        //       url: '/asset-loans',
        //       icon: Handshake,
        //       permission: {
        //         resource: 'asset.loan',
        //         actions: ['view'],
        //       },
        //     },
        //     // {
        //     //   title: 'Perawatan Aset',
        //     //   url: '/maintenances',
        //     //   icon: Wrench,
        //     //   permission: {
        //     //     resource: 'asset.maintenance',
        //     //     actions: ['view'],
        //     //   },
        //     // },
        //     // {
        //     //   title: 'Jadwal Perawatan',
        //     //   url: '/maintenance-schedules',
        //     //   icon: Clock,
        //     //   permission: {
        //     //     resource: 'asset.maintenance',
        //     //     actions: ['view'],
        //     //   },
        //     // },
        //     {
        //       title: 'Persetujuan',
        //       url: '/approvals',
        //       icon: CheckSquare,
        //       permission: {
        //         resource: 'asset.transfer',
        //         actions: ['approve'],
        //       },
        //     },
        //   ],
        // },

        // ---------- ORGANISASI ----------
        {
            title: 'Organisasi',
            items: [
                {
                    title: 'Organisasi',
                    url: '/organizations',
                    icon: Building2,
                    permission: {
                        resource: 'ac',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Department',
                    url: '/departments',
                    icon: Network,
                    permission: {
                        resource: 'department',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Divisi',
                    url: '/divisions',
                    icon: Layers,
                    permission: {
                        resource: 'division',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Pengguna',
                    url: '/users',
                    icon: User,
                    permission: {
                        resource: 'user',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Tim',
                    url: '/teams',
                    icon: Layers,
                    permission: {
                        resource: 'team',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Anggota',
                    url: '/members',
                    icon: UserCircle,
                    permission: {
                        resource: 'employee',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Role',
                    url: '/roles',
                    icon: ShieldCheck,
                    permission: {
                        resource: 'role',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Izin',
                    url: '/permissions',
                    icon: KeyRound,
                    permission: {
                        resource: 'permission',
                        actions: ['view'],
                    },
                },
            ],
        },

        // ---------- PENGATURAN ----------
        {
            title: 'Pengaturan',
            items: [
                {
                    title: 'Profil',
                    url: '/settings/profile',
                    icon: UserCircle,
                },
                {
                    title: 'Preferensi',
                    url: '/settings/preferences',
                    icon: Sliders,
                },
                {
                    title: 'Impor & Ekspor',
                    url: '/settings/import-export',
                    icon: Upload,
                    permission: {
                        resource: 'asset',
                        actions: ['import'],
                    },
                },
            ],
        },
    ],
};
