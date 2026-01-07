'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Building2,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    Users,
    GraduationCap,
    X,
    Save
} from 'lucide-react';

interface SchoolClass {
    id: number;
    name: string;
    grade: string;
    capacity: number;
    room?: string;
    is_active: boolean;
    students_count: number;
    department: {
        id: number;
        code: string;
        name: string;
    };
    academic_year?: {
        id: number;
        name: string;
        is_active: boolean;
    };
    homeroom_teacher?: {
        teacher: {
            id: number;
            user: {
                name: string;
            };
        };
    };
}

const initialFormState = {
    name: '',
    grade: 'X',
    department_id: '',
    capacity: 36,
    room: '',
    homeroom_teacher_id: '',
    academic_year_id: '',
    is_active: true,
};

export default function ClassesPage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 20,
    });
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        department_id: '',
        grade: '',
    });

    // Lookups
    const [departments, setDepartments] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    // Form State
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchLookups();
        fetchClasses();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchClasses();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, filters, pagination.currentPage]);

    const fetchLookups = async () => {
        try {
            const [deptRes, teachRes, yearRes] = await Promise.all([
                api.get('/lookup/departments'),
                api.get('/lookup/teachers'),
                api.get('/lookup/academic-years'),
            ]);

            setDepartments(deptRes.data.data);
            setTeachers(teachRes.data.data);
            setAcademicYears(yearRes.data.data);
        } catch (error) {
            console.error('Failed to fetch lookups:', error);
        }
    };

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                per_page: pagination.perPage.toString(),
                ...(search && { search }),
                ...(filters.department_id && { department_id: filters.department_id }),
                ...(filters.grade && { grade: filters.grade }),
            });

            const response = await api.get(`/classes?${params}`);
            const result = response.data.data;

            setClasses(result.data);
            setPagination({
                currentPage: result.current_page,
                lastPage: result.last_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

        try {
            await api.delete(`/classes/${id}`);
            fetchClasses();
        } catch (error: any) {
            console.error('Failed to delete class:', error);
            alert(error.response?.data?.message || 'Gagal menghapus kelas');
        }
    };

    const handleOpenForm = (schoolClass?: SchoolClass) => {
        if (schoolClass) {
            setEditingId(schoolClass.id);
            setFormData({
                name: schoolClass.name,
                grade: schoolClass.grade,
                department_id: schoolClass.department.id.toString(),
                capacity: schoolClass.capacity,
                room: schoolClass.room || '',
                homeroom_teacher_id: schoolClass.homeroom_teacher?.teacher?.id?.toString() || '',
                academic_year_id: schoolClass.academic_year?.id.toString() || '',
                is_active: schoolClass.is_active,
            });
        } else {
            setEditingId(null);
            const activeYear = academicYears.find(y => y.is_active);
            setFormData({
                ...initialFormState,
                academic_year_id: activeYear ? activeYear.id.toString() : '',
            });
        }
        setFormModalOpen(true);
    };

    const handleCloseForm = () => {
        setFormModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (editingId) {
                await api.put(`/classes/${editingId}`, formData);
                alert('Kelas berhasil diperbarui');
            } else {
                await api.post('/classes', formData);
                alert('Kelas berhasil dibuat');
            }
            handleCloseForm();
            fetchClasses();
        } catch (error: any) {
            console.error('Failed to submit form:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan data kelas');
        } finally {
            setFormLoading(false);
        }
    };

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            X: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            XI: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            XII: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return colors[grade] || colors.X;
    };

    // Group classes by grade for cards view
    const classesByGrade = {
        X: classes.filter(c => c.grade === 'X'),
        XI: classes.filter(c => c.grade === 'XI'),
        XII: classes.filter(c => c.grade === 'XII'),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Data Kelas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kelola kelas dan penempatan siswa
                    </p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 w-fit"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kelas</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['X', 'XI', 'XII'].map((grade) => {
                    const gradeClasses = classesByGrade[grade as keyof typeof classesByGrade];
                    const totalStudents = gradeClasses.reduce((sum, c) => sum + c.students_count, 0);
                    const totalCapacity = gradeClasses.reduce((sum, c) => sum + c.capacity, 0);

                    return (
                        <div key={grade} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <span className={cn('px-4 py-1.5 rounded-lg font-bold text-lg', getGradeColor(grade))}>
                                    Kelas {grade}
                                </span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {gradeClasses.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Siswa</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{totalStudents}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Kapasitas</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{totalCapacity}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama kelas..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.grade}
                            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Tingkat</option>
                            <option value="X">Kelas X</option>
                            <option value="XI">Kelas XI</option>
                            <option value="XII">Kelas XII</option>
                        </select>

                        <select
                            value={filters.department_id}
                            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Jurusan</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-gray-500">
                    <Building2 className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Tidak ada data kelas</p>
                    <p className="text-sm">Tambahkan kelas baru untuk memulai</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {classes.map((schoolClass) => (
                        <div
                            key={schoolClass.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getGradeColor(schoolClass.grade))}>
                                        {schoolClass.grade}
                                    </span>
                                    <Link href={`/classes/${schoolClass.id}`} className="hover:underline">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                                            {schoolClass.name}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-500">{schoolClass.department.name}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Link
                                        href={`/classes/${schoolClass.id}`}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                    >
                                        <Eye className="w-4 h-4 text-blue-500" />
                                    </Link>
                                    <button
                                        onClick={() => handleOpenForm(schoolClass)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <Edit className="w-4 h-4 text-blue-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(schoolClass.id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Students */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Siswa</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {schoolClass.students_count} / {schoolClass.capacity}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                            <div
                                                className={cn(
                                                    'h-1.5 rounded-full transition-all',
                                                    schoolClass.students_count >= schoolClass.capacity ? 'bg-red-500' : 'bg-blue-600'
                                                )}
                                                style={{ width: `${Math.min((schoolClass.students_count / schoolClass.capacity) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Homeroom Teacher */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                        <GraduationCap className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Wali Kelas</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {schoolClass.homeroom_teacher?.teacher?.user?.name || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Room */}
                                {schoolClass.room && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                            <Building2 className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Ruangan</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {schoolClass.room}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.lastPage > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                        disabled={pagination.currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm">
                        {pagination.currentPage} / {pagination.lastPage}
                    </span>
                    <button
                        onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                        disabled={pagination.currentPage === pagination.lastPage}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Form Modal */}
            {formModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                            </h3>
                            <button
                                onClick={handleCloseForm}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Nama Kelas</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: X RPL 1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Tingkat</label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    >
                                        <option value="X">Kelas X</option>
                                        <option value="XI">Kelas XI</option>
                                        <option value="XII">Kelas XII</option>
                                    </select>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Jurusan</label>
                                    <select
                                        required
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    >
                                        <option value="">Pilih Jurusan</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Tahun Ajaran</label>
                                    <select
                                        required
                                        value={formData.academic_year_id}
                                        onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    >
                                        <option value="">Pilih Tahun Ajaran</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {year.name} {year.is_active ? '(Aktif)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Wali Kelas</label>
                                    <select
                                        value={formData.homeroom_teacher_id}
                                        onChange={(e) => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    >
                                        <option value="">Belum Ada Wali Kelas</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.user.name} ({teacher.nip || '-'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Kapasitas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium mb-1">Ruangan (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {formLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan Kelas</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
