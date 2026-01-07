'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import {
    GraduationCap,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    Download,
    Upload,
    Phone,
    Mail,
    Building2,
    X,
    Save,
} from 'lucide-react';

interface Teacher {
    id: number;
    nip?: string;
    nuptk?: string;
    status: string;
    education_level?: string;
    is_homeroom: boolean;
    is_counselor: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        gender: string;
        phone?: string;
        birth_place?: string;
        birth_date?: string;
        religion?: string;
        address?: string;
    };
    department?: {
        id: number;
        code: string;
        name: string;
    };
}

interface PaginatedResponse {
    data: Teacher[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const initialFormState = {
    name: '',
    email: '',
    password: '',
    nip: '',
    nuptk: '',
    status: 'GTY',
    department_id: '',
    education_level: '',
    education_major: '',
    university: '',
    is_homeroom: false,
    is_counselor: false,
    gender: 'L',
    birth_place: '',
    birth_date: '',
    religion: 'Islam',
    address: '',
    phone: '',
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 15,
    });
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        department_id: '',
        status: '',
    });
    const [departments, setDepartments] = useState<any[]>([]);

    // Form State
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    useEffect(() => {
        fetchLookups();
        fetchTeachers();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchTeachers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, filters, pagination.currentPage]);

    const fetchLookups = async () => {
        try {
            const response = await api.get('/lookup/departments');
            setDepartments(response.data.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                per_page: pagination.perPage.toString(),
                ...(search && { search }),
                ...(filters.department_id && { department_id: filters.department_id }),
                ...(filters.status && { status: filters.status }),
            });

            const response = await api.get(`/teachers?${params}`);
            const result: PaginatedResponse = response.data.data;

            setTeachers(result.data);
            setPagination({
                currentPage: result.current_page,
                lastPage: result.last_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;

        try {
            await api.delete(`/teachers/${id}`);
            fetchTeachers();
        } catch (error) {
            console.error('Failed to delete teacher:', error);
            alert('Gagal menghapus guru');
        }
    };

    const handleOpenForm = (teacher?: Teacher) => {
        setFormErrors({});
        if (teacher) {
            setEditingId(teacher.id);
            setFormData({
                name: teacher.user.name,
                email: teacher.user.email,
                password: '',
                nip: teacher.nip || '',
                nuptk: teacher.nuptk || '',
                status: teacher.status,
                department_id: teacher.department?.id.toString() || '',
                education_level: teacher.education_level || '',
                education_major: '',
                university: '',
                is_homeroom: teacher.is_homeroom,
                is_counselor: teacher.is_counselor,
                gender: teacher.user.gender,
                birth_place: teacher.user.birth_place || '',
                birth_date: teacher.user.birth_date ? teacher.user.birth_date.split('T')[0] : '',
                religion: teacher.user.religion || 'Islam',
                address: teacher.user.address || '',
                phone: teacher.user.phone || '',
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setFormModalOpen(true);
    };

    const handleCloseForm = () => {
        setFormModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
        setFormErrors({});
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormErrors({});

        try {
            const dataToSubmit = { ...formData };
            if (editingId && !dataToSubmit.password) {
                delete (dataToSubmit as any).password;
            }

            if (editingId) {
                await api.put(`/teachers/${editingId}`, dataToSubmit);
                alert('Data guru berhasil diperbarui');
            } else {
                await api.post('/teachers', dataToSubmit);
                alert('Guru berhasil ditambahkan');
            }
            handleCloseForm();
            fetchTeachers();
        } catch (error: any) {
            console.error('Failed to submit form:', error);
            if (error.response?.status === 422) {
                setFormErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
            }
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PNS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            PPPK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            Honorer: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            GTY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return styles[status] || styles.GTY;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Data Guru
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kelola data guru dan tenaga pendidik
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Guru</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</div>
                    <div className="text-sm text-gray-500">Total Guru</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">{teachers.filter(t => t.status === 'PNS').length}</div>
                    <div className="text-sm text-gray-500">PNS</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600">{teachers.filter(t => t.is_homeroom).length}</div>
                    <div className="text-sm text-gray-500">Wali Kelas</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-purple-600">{teachers.filter(t => t.is_counselor).length}</div>
                    <div className="text-sm text-gray-500">Guru BK</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau NIP..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.department_id}
                            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Jurusan</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="PNS">PNS</option>
                            <option value="PPPK">PPPK</option>
                            <option value="Honorer">Honorer</option>
                            <option value="GTY">GTY</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : teachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <GraduationCap className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tidak ada data guru</p>
                        <p className="text-sm">Tambahkan guru baru untuk memulai</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Guru
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            NIP / NUPTK
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Jurusan
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Jabatan
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {teachers.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                                                        teacher.user.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                                    )}>
                                                        {getInitials(teacher.user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {teacher.user.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{teacher.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {teacher.nip || '-'}
                                                </p>
                                                {teacher.nuptk && (
                                                    <p className="text-sm text-gray-500">{teacher.nuptk}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {teacher.department ? (
                                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium">
                                                        {teacher.department.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'px-3 py-1 rounded-full text-xs font-medium',
                                                    getStatusBadge(teacher.status)
                                                )}>
                                                    {teacher.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {teacher.is_homeroom && (
                                                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded text-xs">
                                                            Wali Kelas
                                                        </span>
                                                    )}
                                                    {teacher.is_counselor && (
                                                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-xs">
                                                            BK
                                                        </span>
                                                    )}
                                                    {!teacher.is_homeroom && !teacher.is_counselor && (
                                                        <span className="text-gray-400 text-sm">Guru Mapel</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenForm(teacher)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(teacher.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Menampilkan {teachers.length} dari {pagination.total} guru
                            </p>
                            <div className="flex items-center gap-2">
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
                        </div>
                    </>
                )}
            </div>

            {/* Modal Form */}
            {formModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                            </h3>
                            <button
                                onClick={handleCloseForm}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Account Info */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informasi Akun</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Password {editingId && <span className="text-gray-400 font-normal">(Opsional)</span>}
                                            </label>
                                            <input
                                                type="password"
                                                required={!editingId}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Info */}
                                <div className="space-y-4 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Kepegawaian</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Status Kepegawaian</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="GTY">Guru Tetap Yayasan (GTY)</option>
                                                <option value="GTT">Guru Tidak Tetap (GTT)</option>
                                                <option value="PNS">PNS</option>
                                                <option value="PPPK">PPPK</option>
                                                <option value="Honorer">Honorer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Jurusan / Prodi (Opsional)</label>
                                            <select
                                                value={formData.department_id}
                                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="">Tidak Ada / Umum</option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NIP (Opsional)</label>
                                            <input
                                                type="text"
                                                value={formData.nip}
                                                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NUPTK (Opsional)</label>
                                            <input
                                                type="text"
                                                value={formData.nuptk}
                                                onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div className="flex items-center gap-6 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_homeroom}
                                                    onChange={(e) => setFormData({ ...formData, is_homeroom: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Wali Kelas</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_counselor}
                                                    onChange={(e) => setFormData({ ...formData, is_counselor: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Guru BK</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div className="space-y-4 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Pribadi</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="L">Laki-laki</option>
                                                <option value="P">Perempuan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">No. HP / WA</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                                            <input
                                                type="text"
                                                value={formData.birth_place}
                                                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                                            <input
                                                type="date"
                                                value={formData.birth_date}
                                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Alamat Lengkap</label>
                                            <textarea
                                                rows={2}
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {formLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan Guru</span>
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
