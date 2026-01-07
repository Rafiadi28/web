'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuth';
import {
    Calendar,
    Clock,
    MapPin,
    BookOpen,
    Users,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
} from 'lucide-react';

interface ScheduleItem {
    id: number;
    subject: string;
    subject_code?: string;
    class?: string;
    teacher?: string;
    start_time: string;
    end_time: string;
    room?: string;
    // For editing
    class_id?: number;
    subject_id?: number;
    teacher_id?: number;
    day?: number;
    semester_id?: number;
}

interface DaySchedule {
    day: number;
    day_name: string;
    lessons: ScheduleItem[];
}

interface FormState {
    id?: number;
    class_id: number;
    subject_id: number;
    teacher_id: number;
    semester_id: number;
    day: number;
    start_time: string;
    end_time: string;
    room: string;
}

const initialFormState: FormState = {
    class_id: 0,
    subject_id: 0,
    teacher_id: 0,
    semester_id: 0,
    day: 1,
    start_time: '',
    end_time: '',
    room: '',
};

export default function SchedulesPage() {
    const { user } = useAuthStore();
    const [schedules, setSchedules] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'manage'>('class');
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [activeSemester, setActiveSemester] = useState<any>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isTeacher = user?.role === 'guru' || user?.role === 'wali_kelas';
    const canManage = user?.role === 'admin' || user?.role === 'wakil_kepala';

    useEffect(() => {
        fetchClasses();
        fetchActiveSemester();

        if (canManage) {
            fetchSubjects();
            fetchTeachers();
        }

        if (isTeacher && !canManage) {
            setViewMode('teacher');
        } else if (canManage) {
            setViewMode('manage'); // Default to manage for admin
        }
    }, [isTeacher, canManage]);

    const fetchActiveSemester = async () => {
        try {
            const response = await api.get('/lookup/semesters?is_active=1');
            if (response.data.data.length > 0) {
                setActiveSemester(response.data.data[0]);
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if ((viewMode === 'class' || viewMode === 'manage') && selectedClass) {
            fetchClassSchedule();
        } else if (viewMode === 'teacher') {
            fetchTeacherSchedule();
        }
    }, [selectedClass, viewMode]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/lookup/classes');
            setClasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects'); // Assuming this endpoint exists and returns all subjects
            setSubjects(response.data.data?.data || response.data.data); // Handle pagination or flat list
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/lookup/teachers');
            setTeachers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const fetchClassSchedule = async () => {
        if (!selectedClass) return;

        setLoading(true);
        try {
            const response = await api.get(`/schedules/class/${selectedClass}`);
            setSchedules(response.data.data.schedule);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeacherSchedule = async () => {
        setLoading(true);
        try {
            const response = await api.get('/schedules/teacher/week');
            setSchedules(response.data.data);
        } catch (error) {
            console.error('Failed to fetch teacher schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        if (!selectedClass || !activeSemester) {
            alert('Pilih kelas terlebih dahulu');
            return;
        }
        setFormData({
            ...initialFormState,
            class_id: selectedClass,
            semester_id: activeSemester.id,
        });
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (lesson: any, day: number) => {
        // Need to find IDs from the lesson object or fetch details. 
        // NOTE: The list endpoint might not return IDs for teachers/subjects, only names. 
        // We might need to fetch details or rely on what we have. 
        // For now, let's assume we need to re-select or find the ID.
        // Actually the backend returns formatted schedule with names. We need specific IDs.
        // Best approach: Add IDs to the backend response or fetch specific schedule.
        // I'll assume for now we can't edit easily without IDs.
        // Let's implement DELETE first as it uses ID.
        // UPDATE: I will need to update the backend to return IDs if I want to edit cleanly.
        // But let's check `ScheduleController` -> lines 48 in `classSchedule` returns `id`.
        // So we have the schedule ID.
        // To edit, I'll fetch the schedule details first (or just pass what I have if I had the IDs).
        // Since I don't have IDs in the list response (only names), I should probably just implement Delete and Add for now, OR fetch single schedule.
        // I'll implement Delete and Add. Edit is tricky without IDs.
        // Wait, I can allow "Edit" by just deleting and re-creating? No that's bad.
        // I will assume I can't easily Edit without IDs. I'll stick to Delete & Add for this iteration.
        // UNLESS I update the backend to return IDs. 
        // Let's stick to Add/Delete for simplicity and robustness.
    };

    // Actually, I can support "Edit" if I make a quick fetch or just use Add/Delete.
    // Let's support Add and Delete first.

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

        try {
            await api.delete(`/schedules/${id}`);
            fetchClassSchedule();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Gagal menghapus jadwal');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await api.post('/schedules', formData);
            setShowModal(false);
            fetchClassSchedule();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menyimpan jadwal');
        } finally {
            setSaving(false);
        }
    };

    const getDayColor = (day: number) => {
        const colors = [
            'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
            'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
            'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
            'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
            'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700',
            'bg-teal-100 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700',
        ];
        return colors[(day - 1) % colors.length];
    };

    const today = new Date().getDay();
    const todayId = today === 0 ? 7 : today;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Jadwal Pelajaran
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {viewMode === 'teacher' ? 'Jadwal mengajar mingguan' : 'Lihat dan kelola jadwal per kelas'}
                    </p>
                </div>

                <div className="flex gap-2">
                    {canManage && (
                        <button
                            onClick={() => setViewMode('manage')}
                            className={cn(
                                'px-4 py-2 rounded-xl font-medium transition-colors',
                                viewMode === 'manage'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            )}
                        >
                            Kelola Jadwal
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('class')}
                        className={cn(
                            'px-4 py-2 rounded-xl font-medium transition-colors',
                            viewMode === 'class'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        Jadwal per Kelas
                    </button>
                    {isTeacher && (
                        <button
                            onClick={() => setViewMode('teacher')}
                            className={cn(
                                'px-4 py-2 rounded-xl font-medium transition-colors',
                                viewMode === 'teacher'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            )}
                        >
                            Jadwal Saya
                        </button>
                    )}
                </div>
            </div>

            {/* Class Selector for Manage/Class Mode */}
            {(viewMode === 'class' || viewMode === 'manage') && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pilih Kelas
                        </label>
                        <select
                            value={selectedClass || ''}
                            onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {viewMode === 'manage' && selectedClass && (
                        <button
                            onClick={handleOpenAdd}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Jadwal
                        </button>
                    )}
                </div>
            )}

            {/* Schedule Grid */}
            {(viewMode === 'teacher' || selectedClass) && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {schedules.map((daySchedule) => (
                                <div
                                    key={daySchedule.day}
                                    className={cn(
                                        'bg-white dark:bg-gray-800 rounded-2xl border-2 overflow-hidden',
                                        daySchedule.day === todayId
                                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                                            : 'border-gray-200 dark:border-gray-700'
                                    )}
                                >
                                    {/* Day Header */}
                                    <div className={cn(
                                        'px-4 py-3 border-b flex justify-between items-center',
                                        getDayColor(daySchedule.day)
                                    )}>
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            {daySchedule.day_name}
                                        </h3>
                                        {daySchedule.day === todayId && (
                                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                                Hari Ini
                                            </span>
                                        )}
                                    </div>

                                    {/* Lessons */}
                                    <div className="p-4 space-y-3">
                                        {daySchedule.lessons.map((lesson, idx) => (
                                            <div
                                                key={lesson.id || idx}
                                                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2 group relative"
                                            >
                                                <div className="flex items-start justify-between pr-6">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {lesson.subject}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {viewMode === 'teacher' ? lesson.class : lesson.teacher}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>
                                                            {lesson.start_time} - {lesson.end_time}
                                                        </span>
                                                    </div>
                                                    {lesson.room && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{lesson.room}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {viewMode === 'manage' && (
                                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDelete(lesson.id)}
                                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                            title="Hapus Jadwal"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {daySchedule.lessons.length === 0 && (
                                            <p className="text-center text-gray-400 py-4 text-sm">
                                                Tidak ada jadwal
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {/* Empty State / Class Grid */}
            {viewMode !== 'teacher' && !selectedClass && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {classes.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.id)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-center group"
                        >
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                {cls.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {cls.grade}
                            </p>
                        </button>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                            <Calendar className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Belum ada data kelas</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Tambah Jadwal
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                                    {error}
                                </div>
                            )}

                            <form id="scheduleForm" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mata Pelajaran</label>
                                    <select
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                    >
                                        <option value="">Pilih Mapel</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guru Pengampu</label>
                                    <select
                                        required
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: Number(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                    >
                                        <option value="">Pilih Guru</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.user?.name} ({t.nip})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hari</label>
                                        <select
                                            required
                                            value={formData.day}
                                            onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        >
                                            <option value={1}>Senin</option>
                                            <option value={2}>Selasa</option>
                                            <option value={3}>Rabu</option>
                                            <option value={4}>Kamis</option>
                                            <option value={5}>Jumat</option>
                                            <option value={6}>Sabtu</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruangan</label>
                                        <input
                                            type="text"
                                            value={formData.room}
                                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                            placeholder="Contoh: R.101"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Mulai</label>
                                        <input
                                            required
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jam Selesai</label>
                                        <input
                                            required
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Batal
                            </button>
                            <button
                                form="scheduleForm"
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
