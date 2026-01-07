'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { cn, getRoleColor, getInitials } from '@/lib/utils';
import {
    Users,
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    Download,
    Upload,
    MoreVertical,
    GraduationCap,
    Phone,
    Mail,
    X,
    Save,
} from 'lucide-react';

interface Student {
    id: number;
    nis: string;
    nisn?: string;
    entry_year: number;
    status: string;
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
    class?: {
        id: number;
        name: string;
        grade: string;
    };
    department: {
        id: number;
        code: string;
        name: string;
    };
}

interface PaginatedResponse {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const initialFormState = {
    name: '',
    email: '',
    password: '',
    nis: '',
    nisn: '',
    department_id: '',
    class_id: '',
    entry_year: new Date().getFullYear(),
    gender: 'L',
    birth_place: '',
    birth_date: '',
    religion: 'Islam',
    address: '',
    phone: '',
    status: 'aktif',
};

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
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
        class_id: '',
        status: '',
    });
    const [departments, setDepartments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    // Form State
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<any>({});

    useEffect(() => {
        fetchLookups();
        fetchStudents();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchStudents();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, filters, pagination.currentPage]);

    const fetchLookups = async () => {
        try {
            const [deptRes, classRes] = await Promise.all([
                api.get('/lookup/departments'),
                api.get('/lookup/classes'),
            ]);
            setDepartments(deptRes.data.data);
            setClasses(classRes.data.data);
        } catch (error) {
            console.error('Failed to fetch lookups:', error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                per_page: pagination.perPage.toString(),
                ...(search && { search }),
                ...(filters.department_id && { department_id: filters.department_id }),
                ...(filters.class_id && { class_id: filters.class_id }),
                ...(filters.status && { status: filters.status }),
            });

            const response = await api.get(`/students?${params}`, { timeout: 60000 });
            const result: PaginatedResponse = response.data.data;

            setStudents(result.data);
            setPagination({
                currentPage: result.current_page,
                lastPage: result.last_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;

        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
        } catch (error) {
            console.error('Failed to delete student:', error);
            alert('Gagal menghapus siswa');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            aktif: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            lulus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            pindah: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            do: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            cuti: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return styles[status] || styles.aktif;
    };

    // --- Form Handling ---

    const handleOpenForm = (student?: Student) => {
        setFormErrors({});
        if (student) {
            setEditingId(student.id);
            setFormData({
                name: student.user.name,
                email: student.user.email,
                password: '', // Password empty on edit
                nis: student.nis,
                nisn: student.nisn || '',
                department_id: student.department.id.toString(),
                class_id: student.class?.id.toString() || '',
                entry_year: student.entry_year,
                gender: student.user.gender,
                birth_place: student.user.birth_place || '',
                birth_date: student.user.birth_date ? student.user.birth_date.split('T')[0] : '',
                religion: student.user.religion || 'Islam',
                address: student.user.address || '',
                phone: student.user.phone || '',
                status: student.status,
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
            // Remove password if empty during edit to avoid overwriting
            if (editingId && !dataToSubmit.password) {
                delete (dataToSubmit as any).password;
            }

            if (editingId) {
                await api.put(`/students/${editingId}`, dataToSubmit);
                alert('Data siswa berhasil diperbarui');
            } else {
                await api.post('/students', dataToSubmit);
                alert('Siswa berhasil ditambahkan');
            }
            handleCloseForm();
            fetchStudents();
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

    // State untuk Modal Import
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleDownloadTemplate = async () => {
        try {
            // Jika backend belum siap, kita bisa buat dummy Excel atau arahkan ke dedicated endpoint
            const response = await api.get('/students/template', { responseType: 'blob' });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_siswa_dapodik.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download template:', error);
            alert('Gagal mendownload template. Pastikan backend sudah siap.');
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            await api.post('/students/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000,
            });
            alert('Import berhasil! Data sedang diproses.');
            setImportModalOpen(false);
            setImportFile(null);
            fetchStudents(); // Refresh data
        } catch (error: any) {
            console.error('Import failed:', error);
            alert(error.response?.data?.message || 'Gagal mengimport data.');
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('PERHATIAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA SISWA? Tindakan ini tidak dapat dibatalkan! Semua akun siswa dan data terkait akan hilang.')) return;

        // Double confirm for safety
        const confirmText = prompt('Ketik "HAPUS SEMUA" untuk mengkonfirmasi penghapusan massal.');
        if (confirmText !== 'HAPUS SEMUA') {
            alert('Konfirmasi salah. Penghapusan dibatalkan.');
            return;
        }

        try {
            setLoading(true);
            await api.delete('/students/delete-all');
            alert('Semua data siswa berhasil dihapus.');
            fetchStudents();
        } catch (error: any) {
            console.error('Failed to delete all students:', error);
            alert(error.response?.data?.message || 'Gagal menghapus semua data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Data Siswa
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kelola data siswa sekolah
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Hapus Semua</span>
                    </button>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import Siswa</span>
                    </button>
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Siswa</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, NIS, atau NISN..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.department_id}
                            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Jurusan</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.code} - {dept.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="lulus">Lulus</option>
                            <option value="pindah">Pindah</option>
                            <option value="cuti">Cuti</option>
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
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Users className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tidak ada data siswa</p>
                        <p className="text-sm">Tambahkan siswa baru atau import dari Excel</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Siswa
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            NIS / NISN
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Kelas
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Jurusan
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm',
                                                        student.user.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                                    )}>
                                                        {getInitials(student.user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {student.user.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{student.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">{student.nis}</p>
                                                {student.nisn && (
                                                    <p className="text-sm text-gray-500">{student.nisn}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.class ? (
                                                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                                                        {student.class.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-900 dark:text-white">
                                                    {student.department.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'px-3 py-1 rounded-full text-xs font-medium capitalize',
                                                    getStatusBadge(student.status)
                                                )}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Lihat Detail">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenForm(student)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Hapus"
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
                                Menampilkan {students.length} dari {pagination.total} siswa
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                                    disabled={pagination.currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 text-sm">
                                    {pagination.currentPage} / {pagination.lastPage}
                                </span>
                                <button
                                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                                    disabled={pagination.currentPage === pagination.lastPage}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Form Modal (Add/Edit) */}
            {formModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 my-8">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                Password {editingId && <span className="text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>} {!editingId && '*'}
                                            </label>
                                            <input
                                                type="password"
                                                required={!editingId}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password[0]}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Info */}
                                <div className="space-y-4 md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Akademik</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NIS *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.nis}
                                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                            {formErrors.nis && <p className="text-red-500 text-xs mt-1">{formErrors.nis[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">NISN</label>
                                            <input
                                                type="text"
                                                value={formData.nisn}
                                                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                            {formErrors.nisn && <p className="text-red-500 text-xs mt-1">{formErrors.nisn[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tahun Masuk</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.entry_year}
                                                onChange={(e) => setFormData({ ...formData, entry_year: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Tingkat Kelas</label>
                                            <select
                                                required
                                                value={formData.class_id}
                                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="">Pilih Kelas</option>
                                                {classes.map((cls) => (
                                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                                ))}
                                            </select>
                                            {formErrors.class_id && <p className="text-red-500 text-xs mt-1">{formErrors.class_id[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Jurusan</label>
                                            <select
                                                required
                                                value={formData.department_id}
                                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="">Pilih Jurusan</option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>{dept.code}</option>
                                                ))}
                                            </select>
                                            {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id[0]}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="aktif">Aktif</option>
                                                <option value="lulus">Lulus</option>
                                                <option value="pindah">Pindah</option>
                                                <option value="do">Drop Out (DO)</option>
                                                <option value="cuti">Cuti</option>
                                            </select>
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
                                            <label className="block text-sm font-medium mb-1">Agama</label>
                                            <select
                                                value={formData.religion}
                                                onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                            >
                                                <option value="Islam">Islam</option>
                                                <option value="Kristen">Kristen</option>
                                                <option value="Katolik">Katolik</option>
                                                <option value="Hindu">Hindu</option>
                                                <option value="Buddha">Buddha</option>
                                                <option value="Konghucu">Konghucu</option>
                                            </select>
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
                                        <div>
                                            <label className="block text-sm font-medium mb-1">No. HP / WA</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                                            <span>Simpan Siswa</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold mb-4">Import Data Siswa</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Gunakan format <strong>CSV (Comma Delimited)</strong>. File Excel (.xlsx) harus disimpan sebagai CSV terlebih dahulu.
                            <br />
                            <button onClick={handleDownloadTemplate} className="text-blue-500 hover:underline">Download Template CSV</button>
                        </p>

                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv, .txt, .xlsx"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {importFile ? (
                                    <div className="text-sm font-medium text-blue-600">
                                        {importFile.name}
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Klik untuk upload file CSV/Excel</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setImportModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || importing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {importing ? 'Mengupload...' : 'Import Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
