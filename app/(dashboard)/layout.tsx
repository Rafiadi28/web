'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, getInitials, getRoleColor } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    ClipboardCheck,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Bell,
    Search,
    Building2,
    Briefcase,
    CreditCard,
    MessageSquare,
    Printer,
    HeartHandshake,
    Monitor,
    Activity,
} from 'lucide-react';

interface MenuItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        name: 'Siswa',
        href: '/students',
        icon: <Users className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'kepala_sekolah', 'wakil_kepala', 'tata_usaha', 'guru', 'wali_kelas', 'bk'],
    },
    {
        name: 'Guru',
        href: '/teachers',
        icon: <GraduationCap className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'kepala_sekolah', 'wakil_kepala'],
    },
    {
        name: 'Kelas',
        href: '/classes',
        icon: <Building2 className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'kepala_sekolah', 'wakil_kepala', 'guru', 'wali_kelas'],
    },
    {
        name: 'Mata Pelajaran',
        href: '/subjects',
        icon: <BookOpen className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'kepala_sekolah', 'wakil_kepala', 'guru'],
    },
    {
        name: 'Jadwal',
        href: '/schedules',
        icon: <Calendar className="w-5 h-5" />,
    },
    {
        name: 'Presensi',
        href: '/attendance',
        icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
        name: 'Penilaian',
        href: '/assessments',
        icon: <FileText className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'wali_kelas'],
    },
    {
        name: 'Laporan / E-Raport',
        href: '/reports',
        icon: <Printer className="w-5 h-5" />,
    },
    {
        name: 'BP / BK',
        href: '/bk',
        icon: <HeartHandshake className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'bk', 'wali_kelas', 'siswa'],
    },
    {
        name: 'CBT / Ujian',
        href: '/cbt',
        icon: <Monitor className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'siswa'],
    },
    {
        name: 'Perpustakaan',
        href: '/library',
        icon: <BookOpen className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'siswa', 'pustakawan'], // Added new roles
    },
    {
        name: 'PKL/Prakerin',
        href: '/internships',
        icon: <Briefcase className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'siswa'],
    },
    {
        name: 'UKS',
        href: '/uks',
        icon: <Activity className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'guru', 'uks'],
    },
    {
        name: 'Keuangan',
        href: '/finance',
        icon: <CreditCard className="w-5 h-5" />,
        roles: ['super_admin', 'admin', 'bendahara', 'siswa', 'orang_tua'],
    },
    {
        name: 'Pengumuman',
        href: '/announcements',
        icon: <MessageSquare className="w-5 h-5" />,
    },
    {
        name: 'Pengaturan',
        href: '/settings',
        icon: <Settings className="w-5 h-5" />,
        roles: ['super_admin', 'admin'],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, logout, fetchUser } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        // Hanya jalankan redirect jika sudah mounted (client-side)
        if (mounted && !isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [mounted, isLoading, isAuthenticated, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const filteredMenu = menuItems.filter((item) => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    // Mencegah Hydration Mismatch: Jangan render apapun sampai client siap (mounted)
    if (!mounted) {
        return null;
    }

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar - Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Sistem SMK</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
                    {filteredMenu.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                )}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Card at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', getRoleColor(user?.role || ''))}>
                            {getInitials(user?.name || 'U')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.role_name}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Header */}
                <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
                    {/* Left - Menu & Search */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari..."
                                className="bg-transparent border-none outline-none text-sm w-48"
                            />
                        </div>
                    </div>

                    {/* Right - Notifications & User */}
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold', getRoleColor(user?.role || ''))}>
                                    {getInitials(user?.name || 'U')}
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Profil Saya</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Keluar</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
