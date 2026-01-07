'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    ClipboardCheck,
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Save,
    RefreshCw,
} from 'lucide-react';

interface StudentAttendance {
    id: number;
    nis: string;
    name: string;
    gender: string;
    status: string | null;
    notes?: string;
}

interface AttendanceSummary {
    total: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    terlambat: number;
    belum: number;
}

export default function AttendancePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [className, setClassName] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchAttendance();
        }
    }, [selectedClass, selectedDate]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/lookup/classes');
            setClasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchAttendance = async () => {
        if (!selectedClass) return;

        setLoading(true);
        try {
            const response = await api.get(`/attendance/class/${selectedClass}?date=${selectedDate}`);
            const data = response.data.data;
            setStudents(data.students);
            setSummary(data.summary);
            setClassName(data.class.name);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (studentId: number, status: string) => {
        if (status === 'hadir' || status === 'alpha') {
            // Clear notes for present/alpha unless we want to keep them
            // Let's keep them optional
        }
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, status } : s
        ));
    };

    const updateNotes = (studentId: number, notes: string) => {
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, notes } : s
        ));
    };

    const setAllStatus = (status: string) => {
        setStudents(students.map(s => ({ ...s, status })));
    };

    const saveAttendance = async () => {
        if (!selectedClass) return;

        const attendances = students
            .filter(s => s.status)
            .map(s => ({
                student_id: s.id,
                status: s.status,
                notes: s.notes,
            }));

        if (attendances.length === 0) {
            alert('Pilih status presensi untuk minimal 1 siswa');
            return;
        }

        setSaving(true);
        try {
            await api.post('/attendance/submit', {
                class_id: selectedClass,
                date: selectedDate,
                attendances,
            });
            alert('Presensi berhasil disimpan!');
            fetchAttendance();
        } catch (error) {
            console.error('Failed to save attendance:', error);
            alert('Gagal menyimpan presensi');
        } finally {
            setSaving(false);
        }
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const statusOptions = [
        { value: 'hadir', label: 'Hadir', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
        { value: 'izin', label: 'Izin', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { value: 'sakit', label: 'Sakit', icon: XCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
        { value: 'alpha', label: 'Alpha', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
        { value: 'terlambat', label: 'Terlambat', icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Presensi Siswa
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Input presensi harian siswa per kelas
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Class Select */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changeDate(-1)}
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                            />
                            <button
                                onClick={() => changeDate(1)}
                                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Refresh */}
                    <div className="flex items-end">
                        <button
                            onClick={fetchAttendance}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {selectedClass && (
                <>
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
                                <div className="text-sm text-gray-500">Total</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <div className="text-2xl font-bold text-green-600">{summary.hadir}</div>
                                <div className="text-sm text-green-700 dark:text-green-400">Hadir</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <div className="text-2xl font-bold text-blue-600">{summary.izin}</div>
                                <div className="text-sm text-blue-700 dark:text-blue-400">Izin</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                                <div className="text-2xl font-bold text-yellow-600">{summary.sakit}</div>
                                <div className="text-sm text-yellow-700 dark:text-yellow-400">Sakit</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 border border-red-200 dark:border-red-800">
                                <div className="text-2xl font-bold text-red-600">{summary.alpha}</div>
                                <div className="text-sm text-red-700 dark:text-red-400">Alpha</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                <div className="text-2xl font-bold text-gray-600">{summary.belum}</div>
                                <div className="text-sm text-gray-500">Belum</div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500 mr-2">Set Semua:</span>
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setAllStatus(opt.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                                    opt.color.replace('border-', 'hover:border-')
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Student List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NIS</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">L/P</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status Kehadiran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {students.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{student.nis}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{student.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded text-xs font-medium',
                                                        student.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                                    )}>
                                                        {student.gender}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {statusOptions.map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => updateStatus(student.id, opt.value)}
                                                                className={cn(
                                                                    'p-2 rounded-lg border transition-all',
                                                                    student.status === opt.value
                                                                        ? opt.color + ' border-2'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                                                )}
                                                                title={opt.label}
                                                            >
                                                                <opt.icon className="w-4 h-4" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {/* Notes Input for non-Present status */}
                                                    {(student.status && student.status !== 'hadir' && student.status !== 'alpha') && (
                                                        <div className="mt-2">
                                                            <input
                                                                type="text"
                                                                value={student.notes || ''}
                                                                onChange={(e) => updateNotes(student.id, e.target.value)}
                                                                placeholder={student.status === 'sakit' ? 'Sakit apa? (Opsional)' : 'Keterangan izin...'}
                                                                className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={saveAttendance}
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Simpan Presensi
                            </button>
                        </div>
                    </div>
                </>
            )}

            {
                !selectedClass && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-gray-500">
                        <ClipboardCheck className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Pilih Kelas</p>
                        <p className="text-sm">Pilih kelas untuk input presensi</p>
                    </div>
                )
            }
        </div >
    );
}
