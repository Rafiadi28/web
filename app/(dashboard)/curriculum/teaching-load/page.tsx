'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuth';
import {
    Users,
    Search,
    Plus,
    Trash2,
    X,
    BookOpen,
    GraduationCap,
    Clock,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    ArrowRight
} from 'lucide-react';

interface TeacherLoad {
    id: number;
    name: string;
    nip: string;
    is_homeroom: boolean;
    department: string;
    total_hours: number;
}

interface LoadDetail {
    id: number;
    class_id: number;
    class_name: string;
    grade: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    hours: number;
    scheduled_hours?: number; // Added from backend
}

interface TeacherDetail {
    teacher: {
        id: number;
        name: string;
        nip: string;
    };
    loads: LoadDetail[];
}

export default function TeachingLoadPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState<TeacherLoad[]>([]);
    const [search, setSearch] = useState('');

    // Selection state
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<TeacherDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form state
    const [showAddModal, setShowAddModal] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [activeSemester, setActiveSemester] = useState<any>(null);
    const [formData, setFormData] = useState({
        class_id: '',
        subject_id: '',
        hours_per_week: 2
    });
    const [submitting, setSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchTeachers();
        fetchLookups();
    }, []);

    // Fetch Detail when teacher selected
    useEffect(() => {
        if (selectedTeacherId) {
            fetchTeacherDetail(selectedTeacherId);
        } else {
            setDetailData(null);
        }
    }, [selectedTeacherId]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/curriculum/teaching-loads');
            setTeachers(res.data.data);
            if (res.data.semester_id) {
                // We could store semester id if needed
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [classesRes, subjectsRes, semesterRes] = await Promise.all([
                api.get('/lookup/classes'),
                api.get('/lookup/subjects'),
                api.get('/lookup/semesters?is_active=1')
            ]);
            setClasses(classesRes.data.data);
            setSubjects(subjectsRes.data.data?.data || subjectsRes.data.data); // Handle potential pagination wrap
            if (semesterRes.data.data.length > 0) {
                setActiveSemester(semesterRes.data.data[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTeacherDetail = async (id: number) => {
        setLoadingDetail(true);
        try {
            const res = await api.get(`/curriculum/teaching-loads/${id}`);
            setDetailData(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleAddLoad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId || !activeSemester) return;

        setSubmitting(true);
        try {
            await api.post('/curriculum/teaching-loads', {
                teacher_id: selectedTeacherId,
                class_id: formData.class_id,
                subject_id: formData.subject_id,
                hours_per_week: formData.hours_per_week,
                semester_id: activeSemester.id
            });

            // Refresh data
            fetchTeacherDetail(selectedTeacherId);
            fetchTeachers(); // Refresh list stats too
            setShowAddModal(false);
            setFormData({ ...formData, class_id: '', subject_id: '' }); // Reset form
        } catch (e: any) {
            alert(e.response?.data?.message || 'Gagal menyimpan data');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLoad = async (id: number) => {
        if (!confirm('Hapus tugas mengajar ini?')) return;
        try {
            await api.delete(`/curriculum/teaching-loads/${id}`);
            if (selectedTeacherId) fetchTeacherDetail(selectedTeacherId);
            fetchTeachers();
        } catch (e) {
            console.error(e);
            alert('Gagal menghapus');
        }
    };

    // Filter teachers
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.nip?.includes(search)
    );

    // Helpers
    const getLoadStatus = (hours: number) => {
        if (hours < 24) return { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Kurang Jam' };
        if (hours > 24) return { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', label: 'Kelebihan Jam' };
        return { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400', label: 'Ideal' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        Distribusi Jam Mengajar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kelola beban kerja guru dan pembagian tugas per semester
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari Guru..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500">Tidak ada data guru.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredTeachers.map(teacher => {
                                const status = getLoadStatus(teacher.total_hours);
                                const isSelected = selectedTeacherId === teacher.id;

                                return (
                                    <div
                                        key={teacher.id}
                                        onClick={() => setSelectedTeacherId(teacher.id)}
                                        className={cn(
                                            "cursor-pointer group relative overflow-hidden bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg",
                                            isSelected
                                                ? "border-blue-500 ring-1 ring-blue-500 shadow-md"
                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300">
                                                    {teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{teacher.name}</h3>
                                                    <p className="text-xs text-gray-500">{teacher.nip || 'No NIP'}</p>
                                                    <p className="text-xs text-blue-600 mt-1">{teacher.department}</p>
                                                </div>
                                            </div>
                                            <div className={cn("px-2 py-1 rounded text-xs font-medium", status.color)}>
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">Total Beban</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{teacher.total_hours} / 24 JP</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500",
                                                        teacher.total_hours >= 24 ? "bg-green-500" : "bg-blue-500")}
                                                    style={{ width: `${Math.min((teacher.total_hours / 24) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Detail Panel (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-100px)]">
                        {!selectedTeacherId ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                <Users className="w-16 h-16 mb-4 opacity-20" />
                                <p>Pilih guru dari daftar untuk melihat detail dan mengelola beban mengajar.</p>
                            </div>
                        ) : loadingDetail || !detailData ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <>
                                {/* Header Detail */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detail Beban Mengajar</h2>
                                    <p className="text-sm text-gray-500">{detailData.teacher.name}</p>

                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Jam Mengajar
                                    </button>
                                </div>

                                {/* List Assignments */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {detailData.loads.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            Belum ada kelas yang diampu.
                                        </div>
                                    ) : (
                                        detailData.loads.map((item) => (
                                            <div key={item.id} className="bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm flex justify-between items-center group">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.subject_name}</h4>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                                                {item.class_name}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="font-semibold">{item.hours} JP</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                            <span>Terjadwal:</span>
                                                            <span className={cn(
                                                                "font-bold",
                                                                (item.scheduled_hours || 0) < item.hours ? 'text-yellow-500' : 'text-green-500'
                                                            )}>
                                                                {item.scheduled_hours || 0} JP
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteLoad(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Summary Footer */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-gray-600 dark:text-gray-400">Total Jam Diampu</span>
                                        <span className="text-blue-600 text-lg">
                                            {detailData.loads.reduce((acc, curr) => acc + curr.hours, 0)} JP
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Add Assignment */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Tambah Tugas Mengajar</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLoad} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mata Pelajaran</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Mapel --</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Jam (JP)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.hours_per_week}
                                        onChange={(e) => setFormData({ ...formData, hours_per_week: Number(e.target.value) })}
                                    />
                                    <span className="text-gray-500 font-medium">JP</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
