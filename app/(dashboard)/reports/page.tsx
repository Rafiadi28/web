'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
    FileText,
    Download,
    Printer,
    Search,
    ChevronDown,
    Loader2,
    Users,
    BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [legerData, setLegerData] = useState<any>(null);

    // Report Card State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        if (user?.role !== 'siswa') {
            fetchClasses();
        } else if (user?.student) {
            // Directly fetch report for student
            fetchReport(user.student.id);
        }
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            fetchLeger(selectedClass);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/lookup/classes');
            setClasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchLeger = async (classId: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/reports/leger/${classId}`);
            setLegerData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch leger:', error);
            toast.error('Gagal memuat data leger');
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async (studentId: number) => {
        setLoadingReport(true);
        try {
            const response = await api.get(`/reports/student/${studentId}`);
            setReportData(response.data.data);
            setShowReportModal(true);
        } catch (error) {
            console.error('Failed to fetch report:', error);
            toast.error('Gagal memuat rapor siswa');
        } finally {
            setLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header (Hidden when printing) */}
            <div className="print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Laporan Akademik
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Leger Nilai dan Cetak E-Raport
                        </p>
                    </div>
                </div>

                {/* Filters - Only for teachers/admin */}
                {user?.role !== 'siswa' && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
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
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="print:hidden">
                {/* Leger Table */}
                {selectedClass && legerData && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Leger Nilai Kelas {legerData.class.name}</h3>
                            <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Download className="w-4 h-4" /> Download Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 w-10">No</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 sticky left-10 bg-gray-50 dark:bg-gray-900 z-10 w-48">Nama Siswa</th>
                                        {legerData.subjects.map((subj: any) => (
                                            <th key={subj.id} className="px-4 py-3 text-center font-semibold text-gray-500 w-24">
                                                {subj.code}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center font-semibold text-gray-500 w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {legerData.students.map((student: any, idx: number) => (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-4 py-3 text-gray-500 sticky left-0 bg-white dark:bg-gray-800 z-10">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white sticky left-10 bg-white dark:bg-gray-800 z-10 truncate max-w-[12rem]">{student.name}</td>
                                            {legerData.subjects.map((subj: any) => (
                                                <td key={subj.id} className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                                    {student.scores[subj.id] ?? '-'}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => fetchReport(student.id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Lihat Rapor"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* REPORT CARD MODAL / PRINT VIEW */}
            {/* This is hidden by default, shown when showReportModal is true. 
                When printing, we hide everything else and show ONLY this component full page. */}

            {showReportModal && reportData && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm print:bg-white print:static print:inset-auto print:backdrop-blur-none print:block flex items-center justify-center p-4">
                    {/* Close button for Modal Mode */}
                    <div className="fixed top-4 right-4 z-50 print:hidden flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
                            title="Print E-Raport"
                        >
                            <Printer className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="bg-white text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                        >
                            X
                        </button>
                    </div>

                    <div className="bg-white w-full max-w-4xl min-h-[29.7cm] p-[2cm] shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 mx-auto text-black">
                        {/* E-RAPORT CONTENT */}
                        <div className="text-center mb-8 border-b-2 border-double border-black pb-4">
                            <h1 className="text-2xl font-bold uppercase tracking-wide">Laporan Hasil Belajar</h1>
                            <h2 className="text-xl font-bold uppercase">SMK DIGITAL INDONESIA</h2>
                            <p className="text-sm mt-1">Jl. Pendidikan No. 123, Kota Digital, Indonesia</p>
                        </div>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 gap-x-12 mb-8 text-sm">
                            <div className="space-y-1">
                                <div className="flex">
                                    <span className="w-32">Nama Peserta Didik</span>
                                    <span className="mr-2">:</span>
                                    <span className="font-semibold uppercase">{reportData.student.name}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-32">Nomor Induk / NIS</span>
                                    <span className="mr-2">:</span>
                                    <span>{reportData.student.nis}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-32">Sekolah</span>
                                    <span className="mr-2">:</span>
                                    <span>SMK Digital Indonesia</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex">
                                    <span className="w-32">Kelas</span>
                                    <span className="mr-2">:</span>
                                    <span>{reportData.student.class}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-32">Semester</span>
                                    <span className="mr-2">:</span>
                                    <span>{reportData.student.semester_id % 2 === 1 ? 'Ganjil' : 'Genap'}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-32">Tahun Pelajaran</span>
                                    <span className="mr-2">:</span>
                                    <span>2024/2025</span>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <h3 className="font-bold mb-2 uppercase text-sm border-b border-black inline-block">A. Nilai Akademik</h3>
                        <table className="w-full border-collapse border border-black mb-8 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black px-2 py-3 w-10 text-center">No</th>
                                    <th className="border border-black px-2 py-3 text-left">Mata Pelajaran</th>
                                    <th className="border border-black px-2 py-3 w-16 text-center">KKM</th>
                                    <th className="border border-black px-2 py-3 w-16 text-center">Nilai</th>
                                    <th className="border border-black px-2 py-3 w-16 text-center">Predikat</th>
                                    <th className="border border-black px-2 py-3 text-left">Deskripsi Kemampuan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.grades.map((grade: any, idx: number) => (
                                    <tr key={grade.subject_id}>
                                        <td className="border border-black px-2 py-2 text-center">{idx + 1}</td>
                                        <td className="border border-black px-2 py-2">{grade.subject_name}</td>
                                        <td className="border border-black px-2 py-2 text-center">{grade.kkm}</td>
                                        <td className="border border-black px-2 py-2 text-center font-bold">{grade.final_score}</td>
                                        <td className="border border-black px-2 py-2 text-center">{grade.predicate}</td>
                                        <td className="border border-black px-2 py-2 text-xs">{grade.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Attendance (Placeholder) */}
                        <h3 className="font-bold mb-2 uppercase text-sm border-b border-black inline-block">B. Ketidakhadiran</h3>
                        <div className="w-1/2 mb-8">
                            <table className="w-full border-collapse border border-black text-sm">
                                <tbody>
                                    <tr>
                                        <td className="border border-black px-3 py-1 w-1/2">Sakit</td>
                                        <td className="border border-black px-3 py-1">0 Hari</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black px-3 py-1">Izin</td>
                                        <td className="border border-black px-3 py-1">0 Hari</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black px-3 py-1">Tanpa Keterangan</td>
                                        <td className="border border-black px-3 py-1">0 Hari</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between mt-16 text-sm">
                            <div className="text-center">
                                <p className="mb-20">Orang Tua / Wali</p>
                                <p className="font-bold underline">.............................</p>
                            </div>
                            <div className="text-center">
                                <p className="mb-20">Wali Kelas</p>
                                <p className="font-bold underline">.............................</p>
                                <p>NIP. .............................</p>
                            </div>
                            <div className="text-center">
                                <p className="mb-1">Jakarta, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="mb-20">Kepala Sekolah</p>
                                <p className="font-bold underline">Drs. H. Pimpinan Sekolah</p>
                                <p>NIP. 192837192837123</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
