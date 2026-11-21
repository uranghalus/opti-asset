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
    Coins,
    ShieldCheck,
    KeyRound,
    Shield,
    ShieldAlert,
    Users,
    FileDown,
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
                        resource: 'asset.item',
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
                        resource: 'asset.disposal',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Laporan',
                    url: '/reports',
                    icon: FileDown,
                    permission: {
                        resource: 'asset',
                        actions: ['view'],
                    },
                    items: [
                        {
                            title: 'Laporan Mutasi & Penghapusan',
                            url: '/reports',
                        },
                        {
                            title: 'Laporan Daftar Aset',
                            url: '/reports/assets',
                        },
                    ],
                },
                {
                    title: 'Audit Log',
                    url: '/audit-logs',
                    icon: History,
                    permission: {
                        resource: 'audit',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Hak Akses SuperAdmin',
                    url: '/super-admin-grants',
                    icon: Shield,
                    permission: {
                        resource: 'super-admin',
                        actions: ['view'],
                    },
                },
            ],
        },

        // ---------- INVENTORY ----------
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
        //       title: 'Pemrosesan',
        //       url: '/processing',
        //       icon: Factory,
        //       permission: {
        //         resource: 'inventory.processing',
        //         actions: ['view'],
        //       },
        //     },
        //   ],
        // },

        // ---------- USER ----------
        {
            title: 'Pengguna',
            items: [
                {
                    title: 'Pegawai',
                    url: '/employees',
                    icon: Users,
                    permission: {
                        resource: 'employee',
                        actions: ['view'],
                    },
                },
                {
                    title: 'Departemen',
                    url: '/departments',
                    icon: Building2,
                    permission: {
                        resource: 'organization.department',
                        actions: ['view'],
                    },
                },
            ],
        },

        // ---------- PERIZINAN ----------
        {
            title: 'Perizinan',
            items: [
                {
                    title: 'Peran',
                    url: '/roles',
                    icon: ShieldCheck,
                    permission: {
                        resource: 'role',
                        actions: ['view', 'create', 'update', 'delete'],
                    },
                },
                {
                    title: 'Hak Akses',
                    url: '/permissions',
                    icon: KeyRound,
                    permission: {
                        resource: 'permission',
                        actions: ['view', 'create', 'update', 'delete'],
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
                    title: 'Ambang Kapitalisasi',
                    url: '/settings/capitalization-threshold',
                    icon: Coins,
                    permission: {
                        resource: 'setting',
                        actions: ['edit'],
                    },
                },
                {
                    title: 'Impor & Ekspor',
                    url: '/settings/import-export',
                    icon: Upload,
                },
            ],
        },
    ],
};
