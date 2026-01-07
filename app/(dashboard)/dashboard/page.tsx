'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { dashboardApi } from '@/lib/api';
import { DashboardData } from '@/types';
import { cn, getRoleColor } from '@/lib/utils';
import {
    Users,
    GraduationCap,
    BookOpen,
    Building2,
    TrendingUp,
    Calendar,
    ClipboardCheck,
    FileText,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await dashboardApi.get();
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2"></div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                                Selamat Datang, {user?.name?.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-blue-100 text-lg">
                                {data?.message || 'Semoga harimu menyenangkan!'}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <span className={cn(
                                    'px-3 py-1 rounded-full text-sm font-medium bg-white/20',
                                )}>
                                    {user?.role_name}
                                </span>
                                <span className="text-blue-200 text-sm">
                                    {new Date().toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors">
                                Lihat Jadwal
                            </button>
                            <button className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors">
                                Akses Cepat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - For Admin */}
            {data?.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard
                        title="Total Siswa"
                        value={data.stats.total_students || 0}
                        icon={<Users className="w-6 h-6" />}
                        color="blue"
                        trend="+12%"
                    />
                    <StatCard
                        title="Total Guru"
                        value={data.stats.total_teachers || 0}
                        icon={<GraduationCap className="w-6 h-6" />}
                        color="green"
                        trend="+3%"
                    />
                    <StatCard
                        title="Total User"
                        value={data.stats.total_users || 0}
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                    />
                    <StatCard
                        title="Jurusan"
                        value={data.stats.total_departments || 0}
                        icon={<Building2 className="w-6 h-6" />}
                        color="amber"
                    />
                </div>
            )}

            {/* Quick Actions - Based on Role */}
            {data?.quick_actions && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Aksi Cepat
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.quick_actions.map((action) => (
                            <QuickActionCard key={action} action={action} />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Aktivitas Terbaru
                        </h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            Lihat Semua <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <ActivityItem
                            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                            title="Presensi Hari Ini"
                            description="98% siswa hadir hari ini"
                            time="Baru saja"
                        />
                        <ActivityItem
                            icon={<FileText className="w-5 h-5 text-blue-500" />}
                            title="Ujian Matematika"
                            description="Kelas X RPL 1 - 35 siswa mengikuti"
                            time="2 jam lalu"
                        />
                        <ActivityItem
                            icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
                            title="Pembayaran SPP"
                            description="5 siswa belum melakukan pembayaran"
                            time="5 jam lalu"
                        />
                        <ActivityItem
                            icon={<Users className="w-5 h-5 text-purple-500" />}
                            title="Siswa Baru"
                            description="3 siswa baru terdaftar minggu ini"
                            time="Kemarin"
                        />
                    </div>
                </div>

                {/* Calendar / Upcoming */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Jadwal Mendatang
                        </h2>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="space-y-4">
                        <UpcomingItem
                            title="Ujian Tengah Semester"
                            date="20 Des 2024"
                            type="exam"
                        />
                        <UpcomingItem
                            title="Rapat Guru"
                            date="22 Des 2024"
                            type="meeting"
                        />
                        <UpcomingItem
                            title="Libur Semester"
                            date="23 Des 2024"
                            type="holiday"
                        />
                        <UpcomingItem
                            title="Pembagian Rapor"
                            date="27 Des 2024"
                            type="event"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    color,
    trend,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'amber';
    trend?: string;
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 card-hover">
            <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl', colors[color])}>
                    {icon}
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {value.toLocaleString()}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{title}</p>
        </div>
    );
}

// Quick Action Card
function QuickActionCard({ action }: { action: string }) {
    const actionMap: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
        input_attendance: {
            icon: <ClipboardCheck className="w-6 h-6" />,
            label: 'Input Presensi',
            color: 'text-green-600 bg-green-50 dark:bg-green-900/30',
        },
        view_schedule: {
            icon: <Calendar className="w-6 h-6" />,
            label: 'Lihat Jadwal',
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
        },
        manage_grades: {
            icon: <FileText className="w-6 h-6" />,
            label: 'Kelola Nilai',
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
        },
        view_grades: {
            icon: <FileText className="w-6 h-6" />,
            label: 'Lihat Nilai',
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
        },
        take_exam: {
            icon: <BookOpen className="w-6 h-6" />,
            label: 'Ikuti Ujian',
            color: 'text-red-600 bg-red-50 dark:bg-red-900/30',
        },
    };

    const config = actionMap[action] || {
        icon: <ArrowRight className="w-6 h-6" />,
        label: action,
        color: 'text-gray-600 bg-gray-50',
    };

    return (
        <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left">
            <div className={cn('p-3 rounded-xl', config.color)}>
                {config.icon}
            </div>
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                <p className="text-sm text-gray-500">Klik untuk mulai</p>
            </div>
        </button>
    );
}

// Activity Item
function ActivityItem({
    icon,
    title,
    description,
    time,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {time}
            </div>
        </div>
    );
}

// Upcoming Item
function UpcomingItem({
    title,
    date,
    type,
}: {
    title: string;
    date: string;
    type: 'exam' | 'meeting' | 'holiday' | 'event';
}) {
    const typeColors = {
        exam: 'bg-red-500',
        meeting: 'bg-blue-500',
        holiday: 'bg-green-500',
        event: 'bg-purple-500',
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className={cn('w-1 h-10 rounded-full', typeColors[type])}></div>
            <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{title}</p>
                <p className="text-sm text-gray-500">{date}</p>
            </div>
        </div>
    );
}
