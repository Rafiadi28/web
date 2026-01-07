'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    Users,
    GraduationCap,
    Building2,
    Calendar,
    Plus,
    Trash2,
    Search,
    X,
    Save,
    MoreVertical,
    CheckCircle2
} from 'lucide-react';

interface Student {
    id: number;
    nis: string;
    status: string;
    class_id?: number;
    user: {
        name: string;
        gender: string;
    };
    department: {
        code: string;
        name: string;
    };
}

interface ClassDetail {
    id: number;
    name: string;
    grade: string;
    capacity: number;
    room?: string;
    students_count: number;
    department: {
        id: number;
        code: string;
        name: string;
    };
    academic_year?: {
        name: string;
    };
    homeroom_teacher?: {
        teacher: {
            user: {
                name: string;
            };
        };
    };
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use()
    const { id } = use(params);

    const [classData, setClassData] = useState<ClassDetail | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentPage, setStudentPage] = useState(1);
    const [studentTotal, setStudentTotal] = useState(0);

    useEffect(() => {
        if (id) {
            fetchClassData();
            fetchClassStudents();
        }
    }, [id]);

    // Fetch details
    const fetchClassData = async () => {
        try {
            const response = await api.get(`/classes/${id}`);
            setClassData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch class:', error);
            // router.push('/classes');
        }
    };

    const fetchClassStudents = async () => {
        setLoading(true);
        try {
            // Using the specific endpoint for class students
            const response = await api.get(`/classes/${id}/students`);
            setStudents(response.data.data.students);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!confirm('Apakah Anda yakin ingin mengeluarkan siswa ini dari kelas?')) return;

        try {
            await api.delete(`/classes/${id}/students/${studentId}`);
            fetchClassData(); // Update counts
            fetchClassStudents(); // Update list
        } catch (error: any) {
            console.error('Failed to remove student:', error);
            alert(error.response?.data?.message || 'Gagal mengeluarkan siswa');
        }
    };

    // --- Enrollment Logic ---

    useEffect(() => {
        if (enrollModalOpen) {
            fetchAvailableStudents();
        }
    }, [enrollModalOpen, studentSearch, studentPage]);

    const fetchAvailableStudents = async () => {
        try {
            const params = new URLSearchParams({
                has_class: 'false', // Only students without class
                page: studentPage.toString(),
                per_page: '10',
                ...(studentSearch && { search: studentSearch }),
                ...(classData?.department.id && { department_id: classData.department.id.toString() }) // Filter by same department
            });

            const response = await api.get(`/students?${params}`, { timeout: 30000 });
            setAvailableStudents(response.data.data.data);
            setStudentTotal(response.data.data.total);
        } catch (error) {
            console.error('Failed to fetch available students:', error);
        }
    };

    const handleToggleSelect = (studentId: number) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleEnrollSubmit = async () => {
        if (selectedStudents.length === 0) return;

        setEnrollLoading(true);
        try {
            await api.post(`/classes/${id}/enroll`, {
                student_ids: selectedStudents
            });
            alert('Siswa berhasil ditambahkan ke kelas!');
            setEnrollModalOpen(false);
            setSelectedStudents([]);
            fetchClassData();
            fetchClassStudents();
        } catch (error: any) {
            console.error('Enrollment failed:', error);
            alert(error.response?.data?.message || 'Gagal menambahkan siswa');
        } finally {
            setEnrollLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis.includes(searchTerm)
    );

    if (!classData && !loading) return <div>Kelas tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-2">
                <Link href="/classes" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                    <div className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Kembali ke Data Kelas</span>
                </Link>
            </div>

            {/* Class Header info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-bold text-sm">
                                {classData?.grade}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {classData?.academic_year?.name}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {classData?.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {classData?.department.name}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs">Siswa</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {classData?.students_count} <span className="text-xs text-gray-400 font-normal">/ {classData?.capacity}</span>
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 sm:col-span-2">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <GraduationCap className="w-4 h-4" />
                                <span className="text-xs">Wali Kelas</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {classData?.homeroom_teacher?.teacher?.user?.name || 'Belum ditentukan'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Building2 className="w-4 h-4" />
                                <span className="text-xs">Ruangan</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {classData?.room || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Daftar Anggota Kelas
                    </h3>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari siswa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                            />
                        </div>
                        <button
                            onClick={() => setEnrollModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Tambah Siswa</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Belum ada siswa di kelas ini</p>
                        <p className="text-sm">Klik tombol "Tambah Siswa" untuk memasukkan siswa</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIS</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">L/P</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStudents.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                                                    student.user.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                                )}>
                                                    {getInitials(student.user.name)}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {student.user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">{student.nis}</td>
                                        <td className="px-6 py-4 text-gray-500">{student.user.gender}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-2 py-0.5 rounded text-xs font-medium capitalize',
                                                student.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            )}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemoveStudent(student.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Keluarkan dari Kelas"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Enrollment Modal */}
            {enrollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Tambah Siswa ke Kelas
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Menampilkan siswa jurusan <strong>{classData?.department.code}</strong> yang belum memiliki kelas.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEnrollModalOpen(false);
                                    setSelectedStudents([]);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            {/* Search available students */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari siswa yang belum dapat kelas..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {availableStudents.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p>Tidak ada siswa tersedia (sesuai jurusan) yang belum memiliki kelas.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableStudents.map((student) => {
                                        const isSelected = selectedStudents.includes(student.id);
                                        return (
                                            <div
                                                key={student.id}
                                                onClick={() => handleToggleSelect(student.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all",
                                                    isSelected
                                                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500"
                                                        : "bg-white border-gray-100 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                                                        student.user.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                                    )}>
                                                        {getInitials(student.user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{student.user.name}</p>
                                                        <p className="text-xs text-gray-500">{student.nis}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "bg-blue-500 border-blue-500 text-white"
                                                        : "border-gray-300 dark:border-gray-600"
                                                )}>
                                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pagination for modal (Simple) */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
                            <div>
                                {selectedStudents.length} siswa dipilih
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                    disabled={studentPage === 1}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span>Halaman {studentPage}</span>
                                <button
                                    onClick={() => setStudentPage(p => p + 1)}
                                    disabled={availableStudents.length < 10} // Rough check
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setEnrollModalOpen(false);
                                    setSelectedStudents([]);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleEnrollSubmit}
                                disabled={selectedStudents.length === 0 || enrollLoading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                {enrollLoading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
