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
    Printer,
    Edit,
} from 'lucide-react';

const DAYS = [
    { id: 1, name: 'Senin', group: 'mon_thu' },
    { id: 2, name: 'Selasa', group: 'mon_thu' },
    { id: 3, name: 'Rabu', group: 'mon_thu' },
    { id: 4, name: 'Kamis', group: 'mon_thu' },
    { id: 5, name: 'Jumat', group: 'fri' },
    { id: 6, name: 'Sabtu', group: 'sat' },
];

interface LessonHour {
    slot: number;
    start: string;
    end: string;
}

interface ScheduleItem {
    id: number;
    subject: string;
    subject_code?: string;
    class?: string;
    teacher?: string;
    start_time: string;
    end_time: string;
    room?: string;

    // IDs for editing
    class_id?: number;
    subject_id?: number;
    teacher_id?: number;
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
    start_jp: number; // Jam Pelajaran ke-
    end_jp: number; // Sampai Jam Pelajaran ke-
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
    start_jp: 1,
    end_jp: 1,
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
    const [lessonHoursConfig, setLessonHoursConfig] = useState<Record<string, LessonHour[]>>({});

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [classTeachingLoads, setClassTeachingLoads] = useState<any[]>([]);

    const isTeacher = user?.role === 'guru' || user?.role === 'wali_kelas';
    const canManage = user?.role === 'admin' || user?.role === 'wakil_kepala';

    useEffect(() => {
        fetchClasses();
        fetchActiveSemester();
        fetchLessonHours();

        if (canManage) {
            fetchSubjects();
            fetchTeachers();
        }

        if (isTeacher && !canManage) {
            setViewMode('teacher');
        } else if (canManage) {
            setViewMode('manage');
        }
    }, [isTeacher, canManage]);

    const fetchLessonHours = async () => {
        try {
            const res = await api.get('/lesson-hours');
            // Backend returns: { "1": [...], "2": [...], ... "5": [...], "6": [...] }
            // We map grouped days
            const data = res.data.data;
            const config: Record<string, LessonHour[]> = {};

            // Map day number 1 (Mon) representative for mon_thu
            // 5 for fri, 6 for sat
            if (data['1']) config['mon_thu'] = data['1'];
            if (data['5']) config['fri'] = data['5'];
            if (data['6']) config['sat'] = data['6'];

            setLessonHoursConfig(config);
        } catch (e) {
            console.error(e);
        }
    }

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
            fetchClassTeachingLoads();
        } else if (viewMode === 'teacher') {
            fetchTeacherSchedule();
        }
    }, [selectedClass, viewMode]);

    const fetchClassTeachingLoads = async () => {
        if (!selectedClass) return;
        try {
            const res = await api.get(`/curriculum/teaching-loads/class/${selectedClass}`);
            setClassTeachingLoads(res.data.data);
        } catch (e) {
            console.error('Failed to fetch class teaching loads', e);
        }
    };

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
            const response = await api.get('/subjects');
            setSubjects(response.data.data?.data || response.data.data);
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

    const getGroupForDay = (dayId: number) => {
        if (dayId === 6) return 'sat';
        if (dayId === 5) return 'fri';
        return 'mon_thu';
    };

    const getHoursForDay = (dayId: number) => {
        const group = getGroupForDay(dayId);
        return lessonHoursConfig[group] || [];
    };

    // Helper to get ALL max slots across all configs to render enough rows
    const getMaxSlots = () => {
        let max = 0;
        Object.values(lessonHoursConfig).forEach(arr => {
            const last = arr[arr.length - 1];
            if (last && last.slot > max) max = last.slot;
        });
        return max || 10; // Default 10 if empty
    };

    const handleOpenAdd = () => {
        if (!selectedClass || !activeSemester) {
            alert('Pilih kelas terlebih dahulu');
            return;
        }

        // Default using Mon-Thu hours
        const defaultHours = lessonHoursConfig['mon_thu'] || [];
        const firstHour = defaultHours[0] || { start: '07:00', end: '07:40' };

        setFormData({
            ...initialFormState,
            class_id: selectedClass,
            semester_id: activeSemester.id,
            start_time: firstHour.start,
            end_time: firstHour.end
        });
        setIsEditMode(false);
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (lesson: ScheduleItem, day: number) => {
        if (!lesson.subject_id || !lesson.teacher_id) {
            alert("Data jadwal tidak lengkap untuk diedit.");
            return;
        }

        // Get slots for this day
        const dayHours = getHoursForDay(day);
        const startJp = dayHours.find(l => l.start === lesson.start_time)?.slot || 1;
        const endJp = dayHours.find(l => l.end === lesson.end_time)?.slot || startJp;

        setFormData({
            id: lesson.id,
            class_id: lesson.class_id || selectedClass || 0,
            subject_id: lesson.subject_id,
            teacher_id: lesson.teacher_id,
            semester_id: lesson.semester_id || activeSemester?.id,
            day: day,
            start_jp: startJp,
            end_jp: endJp,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            room: lesson.room || '',
        });
        setIsEditMode(true);
        setError('');
        setShowModal(true);
    };

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

    const handleSubjectChange = (subjectId: number) => {
        // Find allocation
        const alloc = classTeachingLoads.find(l => l.subject_id === subjectId);
        if (alloc) {
            setFormData({
                ...formData,
                subject_id: subjectId,
                teacher_id: alloc.teacher_id // Auto-select assigned teacher!
            });
        } else {
            // Fallback if not found (maybe generic add?)
            setFormData({ ...formData, subject_id: subjectId });
        }
    }

    // Handle perubahan JP
    const handleJpChange = (type: 'start' | 'end', val: number) => {
        const newData = { ...formData };
        const dayHours = getHoursForDay(newData.day);

        if (type === 'start') {
            newData.start_jp = val;
            if (newData.end_jp < val) newData.end_jp = val;

            const lesson = dayHours.find(l => l.slot === val);
            if (lesson) newData.start_time = lesson.start;

            // Sync end
            const endLesson = dayHours.find(l => l.slot === newData.end_jp);
            if (endLesson) newData.end_time = endLesson.end;

        } else {
            newData.end_jp = val;
            if (newData.start_jp > val) newData.start_jp = val;

            const lesson = dayHours.find(l => l.slot === val);
            if (lesson) newData.end_time = lesson.end;

            // Sync start
            const startLesson = dayHours.find(l => l.slot === newData.start_jp);
            if (startLesson) newData.start_time = startLesson.start;
        }

        setFormData(newData);
    };

    // When changing DAY in form, reset JPs if out of bound?
    const handleDayChange = (day: number) => {
        const newData = { ...formData, day };
        // Check if current JPs are valid for this new day
        const newHours = getHoursForDay(day);

        // Validate start_jp
        let startLesson = newHours.find(l => l.slot === newData.start_jp);
        if (!startLesson) {
            // Fallback to slot 1
            startLesson = newHours[0];
            newData.start_jp = 1;
        }
        if (startLesson) newData.start_time = startLesson.start;

        // Validate end_jp
        let endLesson = newHours.find(l => l.slot === newData.end_jp);
        if (!endLesson) {
            endLesson = startLesson;
            newData.end_jp = newData.start_jp;
        }
        if (endLesson) newData.end_time = endLesson.end;

        setFormData(newData);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (isEditMode && formData.id) {
                await api.put(`/schedules/${formData.id}`, formData);
            } else {
                await api.post('/schedules', formData);
            }
            setShowModal(false);
            fetchClassSchedule();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menyimpan jadwal');
        } finally {
            setSaving(false);
        }
    };

    // Helper to find lesson in a specific day and JP
    const getLessonInSlot = (dayIdx: number, jp: number, dayHours: LessonHour[]) => {
        const daySchedule = schedules.find(s => s.day === dayIdx);
        if (!daySchedule) return null;

        return daySchedule.lessons.find(l => {
            const startJp = dayHours.find(h => h.start === l.start_time)?.slot || 0;
            const endJp = dayHours.find(h => h.end === l.end_time)?.slot || 0;
            return jp >= startJp && jp <= endJp;
        });
    };

    // Helper to check if this slot is the START of a lesson (to render cell with rowspan)
    const getLessonStart = (dayIdx: number, jp: number, dayHours: LessonHour[]) => {
        const daySchedule = schedules.find(s => s.day === dayIdx);
        if (!daySchedule) return null;

        return daySchedule.lessons.find(l => {
            // Find which slot this lesson covers based on start time dynamic config
            const lessonStartSlot = dayHours.find(h => h.start === l.start_time)?.slot;
            return lessonStartSlot === jp;
        });
    };

    // Check if slot is occupied by a lesson starting earlier
    const isSlotOccupied = (dayIdx: number, jp: number, dayHours: LessonHour[]) => {
        const daySchedule = schedules.find(s => s.day === dayIdx);
        if (!daySchedule) return false;

        return daySchedule.lessons.some(l => {
            const startJp = dayHours.find(h => h.start === l.start_time)?.slot || 0;
            const endJp = dayHours.find(h => h.end === l.end_time)?.slot || 0;
            return jp > startJp && jp <= endJp;
        });
    };

    // Print functionality
    const handlePrint = () => {
        if (!selectedClass && viewMode !== 'teacher') {
            alert('Silakan pilih kelas terlebih dahulu');
            return;
        }
        window.print();
    };

    // Generate rows 1..MaxSlot
    const maxSlots = getMaxSlots();
    const rows = Array.from({ length: maxSlots }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Jadwal Pelajaran
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {viewMode === 'teacher' ? 'Jadwal mengajar mingguan' : 'Lihat dan kelola jadwal per kelas'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-xl font-medium transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Cetak
                    </button>

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
                            <Edit className="w-4 h-4 inline mr-2" />
                            Kelola Jadwal
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setViewMode('class');
                            setSelectedClass(null);
                        }}
                        className={cn(
                            'px-4 py-2 rounded-xl font-medium transition-colors',
                            viewMode === 'class'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
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
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Jadwal Saya
                        </button>
                    )}
                </div>
            </div>

            {/* Printable Header - Visible only on Print */}
            <div className="hidden print:block mb-8 text-center">
                <h2 className="text-xl font-bold uppercase mb-1">
                    Jadwal Pelajaran {activeSemester?.name || ''}
                </h2>
                {selectedClass && (
                    <h3 className="text-2xl font-black mb-2">
                        {classes.find(c => c.id === selectedClass)?.name || ''}
                    </h3>
                )}
                {viewMode === 'teacher' && user?.teacher && (
                    <h3 className="text-xl font-bold mb-2">
                        Guru: {user.name}
                    </h3>
                )}
                <div className="text-sm text-gray-500">
                    Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Class Selector for Manage/Class Mode */}
            {(viewMode === 'class' || viewMode === 'manage') && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4 items-end no-print">
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

            {/* Timetable View */}
            {(viewMode === 'teacher' || selectedClass) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-700 w-20">
                                        Jam Ke
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0 w-1/6">
                                            {day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rows.map((slot) => (
                                    <tr key={slot} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        {/* Kolom Jam (First Column) - Use Mon-Thu as reference for general time if exists, or blank */}
                                        <td className="px-2 py-3 border-r border-gray-200 dark:border-gray-700 text-center">
                                            <div className="font-bold text-gray-900 dark:text-white">{slot}</div>
                                            {/* We can show Mon-Thu time as reference? Or just slot number */}
                                            {lessonHoursConfig['mon_thu']?.find(h => h.slot === slot) && (
                                                <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded mt-1">
                                                    {lessonHoursConfig['mon_thu'].find(h => h.slot === slot)?.start}
                                                </div>
                                            )}
                                        </td>

                                        {/* Kolom Hari */}
                                        {DAYS.map(day => {
                                            const dayHours = getHoursForDay(day.id);
                                            const currentSlotConfig = dayHours.find(h => h.slot === slot);

                                            // Handle case if this slot DOES NOT EXIST for this day (e.g. Sat slot 10)
                                            if (!currentSlotConfig) {
                                                return (
                                                    <td key={day.id} className="bg-gray-100 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700"></td>
                                                );
                                            }

                                            if (isSlotOccupied(day.id, slot, dayHours)) return null;

                                            const lesson = getLessonStart(day.id, slot, dayHours);

                                            // Calculate Rowspan
                                            let rowSpan = 1;
                                            if (lesson) {
                                                const startJp = dayHours.find(h => h.start === lesson.start_time)?.slot || slot;
                                                const endJp = dayHours.find(h => h.end === lesson.end_time)?.slot || slot;
                                                rowSpan = endJp - startJp + 1;
                                            }

                                            return (
                                                <td
                                                    key={day.id}
                                                    rowSpan={rowSpan}
                                                    className={cn(
                                                        "p-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0 align-top h-full",
                                                        lesson ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                    )}
                                                >
                                                    {lesson ? (
                                                        <div className="h-full w-full bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-lg shadow-sm p-3 relative group hover:shadow-md transition-shadow">
                                                            <div className="text-xs font-semibold text-blue-600 mb-1">
                                                                {lesson.subject_code || 'MAPEL'} ({lesson.start_time.substring(0, 5)}-{lesson.end_time.substring(0, 5)})
                                                            </div>
                                                            <div className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
                                                                {lesson.subject}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                                                <Users className="w-3 h-3" />
                                                                <span className="truncate max-w-[100px]">{viewMode === 'teacher' ? lesson.class : lesson.teacher}</span>
                                                            </div>
                                                            {lesson.room && (
                                                                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {lesson.room}
                                                                </div>
                                                            )}

                                                            {/* Action Buttons */}
                                                            {viewMode === 'manage' && (
                                                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded p-0.5 shadow-sm">
                                                                    <button
                                                                        onClick={() => handleOpenEdit(lesson, day.id)}
                                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(lesson.id)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                        title="Hapus"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Empty Slot
                                                        <div className="h-full min-h-[60px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                            {viewMode === 'manage' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...initialFormState,
                                                                            class_id: selectedClass || 0,
                                                                            semester_id: activeSemester?.id,
                                                                            day: day.id,
                                                                            start_jp: slot,
                                                                            end_jp: slot,
                                                                            start_time: currentSlotConfig?.start || '',
                                                                            end_time: currentSlotConfig?.end || '',
                                                                        });
                                                                        setIsEditMode(false);
                                                                        setShowModal(true);
                                                                    }}
                                                                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {isEditMode ? 'Edit Jadwal' : 'Tambah Jadwal'}
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
                                {isEditMode && (
                                    <div className="text-yellow-600 bg-yellow-50 p-3 rounded-lg text-sm mb-2">
                                        Perhatian: Mengedit jadwal tidak otomatis mengubah alokasi beban mengajar guru.
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mata Pelajaran (Sesuai Distribusi)</label>
                                    <select
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => handleSubjectChange(Number(e.target.value))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                    >
                                        <option value="">-- Pilih Mapel --</option>
                                        {classTeachingLoads.length > 0 ? (
                                            classTeachingLoads.map(alloc => (
                                                <option key={alloc.subject_id} value={alloc.subject_id}>
                                                    {alloc.subject_name} ({alloc.hours_allocated} JP)
                                                    {/* Show current usage? e.g. Used: X */}
                                                </option>
                                            ))
                                        ) : (
                                            // Fallback to all subjects if no allocation found (shouldn't happen if initialized properly)
                                            subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                            ))
                                        )}
                                    </select>
                                    {classTeachingLoads.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Belum ada distribusi jam mengajar untuk kelas ini.
                                            <a href="/curriculum/teaching-load" className="underline font-bold ml-1">Atur Distribusi</a>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guru Pengampu</label>
                                    <select
                                        required
                                        disabled={classTeachingLoads.length > 0} // Lock teacher if auto-selected
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: Number(e.target.value) })}
                                        className={cn(
                                            "w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600",
                                            classTeachingLoads.length > 0
                                                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                                : "bg-gray-50 dark:bg-gray-700"
                                        )}
                                    >
                                        <option value="">Pilih Guru</option>
                                        {/* If locked, valid only selected one, but let's render all just in case or just the one */}
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.user?.name} ({t.nip})</option>
                                        ))}
                                    </select>
                                    {/* Helper text showing allocation detail */}
                                    {formData.subject_id && (
                                        (() => {
                                            const alloc = classTeachingLoads.find(l => l.subject_id === formData.subject_id);
                                            if (alloc) return (
                                                <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                    <strong>Info:</strong> {alloc.teacher_name} dialokasikan <strong>{alloc.hours_allocated} JP</strong> per minggu.
                                                    {/* (Tersedia slot...) */}
                                                </div>
                                            );
                                            return null;
                                        })()
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hari</label>
                                        <select
                                            required
                                            value={formData.day}
                                            onChange={(e) => handleDayChange(Number(e.target.value))}
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mulai Jam Ke-</label>
                                        <select
                                            required
                                            value={formData.start_jp}
                                            onChange={(e) => handleJpChange('start', Number(e.target.value))}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        >
                                            {getHoursForDay(formData.day).map(ls => (
                                                <option key={ls.slot} value={ls.slot}>JP {ls.slot} ({ls.start})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sampai Jam Ke-</label>
                                        <select
                                            required
                                            value={formData.end_jp}
                                            onChange={(e) => handleJpChange('end', Number(e.target.value))}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                        >
                                            {getHoursForDay(formData.day).map(ls => (
                                                <option key={ls.slot} value={ls.slot}>JP {ls.slot} ({ls.end})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Hidden Inputs for backend compatibility */}
                                <input type="hidden" value={formData.start_time} readOnly />
                                <input type="hidden" value={formData.end_time} readOnly />

                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                                    <span className="font-semibold">Waktu:</span> {formData.start_time} - {formData.end_time}
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
