'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    FolderOpen,
    X,
    Save,
    Check,
} from 'lucide-react';

interface Subject {
    id: number;
    code: string;
    name: string;
    type: string;
    department_id?: number | null;
    department?: {
        id: number;
        code: string;
        name: string;
    };
    description?: string;
    is_active: boolean;
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 20,
    });
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        department_id: '',
    });
    const [departments, setDepartments] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        code: '',
        name: '',
        type: 'kelompok_a',
        department_id: '' as string | number,
        description: '',
        is_active: true,
    });

    useEffect(() => {
        fetchLookups();
        fetchSubjects();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSubjects();
        }, 300);
        return () => clearTimeout(debounce);
    }, [filters, pagination.currentPage]);

    const fetchLookups = async () => {
        try {
            const response = await api.get('/lookup/departments');
            setDepartments(response.data.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                per_page: pagination.perPage.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.type && { type: filters.type }),
                ...(filters.department_id && { department_id: filters.department_id }),
            });

            const response = await api.get(`/subjects?${params}`);
            const result = response.data.data;

            setSubjects(result.data);
            setPagination({
                currentPage: result.current_page,
                lastPage: result.last_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;

        try {
            await api.delete(`/subjects/${id}`);
            fetchSubjects();
        } catch (error: any) {
            console.error('Failed to delete subject:', error);
            alert(error.response?.data?.message || 'Gagal menghapus mata pelajaran');
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({
            id: 0,
            code: '',
            name: '',
            type: 'kelompok_a',
            department_id: '',
            description: '',
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (subject: Subject) => {
        setIsEditing(true);
        setFormData({
            id: subject.id,
            code: subject.code,
            name: subject.name,
            type: subject.type,
            department_id: subject.department_id || '',
            description: subject.description || '',
            is_active: subject.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                department_id: formData.department_id || null, // Convert empty string to null
            };

            if (isEditing) {
                await api.put(`/subjects/${formData.id}`, payload);
            } else {
                await api.post('/subjects', payload);
            }

            setShowModal(false);
            fetchSubjects();
        } catch (error: any) {
            console.error('Submit failed:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan data');
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            kelompok_a: 'Muatan Nasional (A)',
            kelompok_b: 'Muatan Kewilayahan (B)',
            kelompok_c1: 'Dasar Bidang Keahlian (C1)',
            kelompok_c2: 'Dasar Program Keahlian (C2)',
            kelompok_c3: 'Kompetensi Keahlian (C3)',
            mulok: 'Muatan Lokal',
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        if (type === 'kelompok_a' || type === 'kelompok_b') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (type.startsWith('kelompok_c')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    };

    const isVocational = formData.type.startsWith('kelompok_c') || formData.type === 'mulok';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Mata Pelajaran
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Daftar mata pelajaran muatan nasional, kewilayahan, dan kejuruan
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 w-fit"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mapel</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Cari kode atau nama mapel..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Kelompok</option>
                            <option value="kelompok_a">Muatan Nasional (A)</option>
                            <option value="kelompok_b">Muatan Kewilayahan (B)</option>
                            <option value="kelompok_c1">Dasar Bidang Keahlian (C1)</option>
                            <option value="kelompok_c2">Dasar Program Keahlian (C2)</option>
                            <option value="kelompok_c3">Kompetensi Keahlian (C3)</option>
                            <option value="mulok">Muatan Lokal</option>
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

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-gray-500">
                        <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tidak ada mata pelajaran</p>
                        <p className="text-sm">Tambahkan mata pelajaran baru untuk memulai</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kode</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mata Pelajaran</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kelompok</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Jurusan</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {subjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {subject.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{subject.name}</div>
                                            {subject.description && (
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{subject.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                'px-3 py-1 rounded-full text-xs font-medium',
                                                getTypeColor(subject.type)
                                            )}>
                                                {getTypeLabel(subject.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {subject.department ? (
                                                <span className="flex items-center gap-1">
                                                    <FolderOpen className="w-3 h-3" />
                                                    {subject.department.code}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Umum</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                'px-2 py-1 rounded text-xs font-medium',
                                                subject.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            )}>
                                                {subject.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(subject)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
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
                )}

                {/* Pagination */}
                {pagination.lastPage > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Menampilkan {subjects.length} dari {pagination.total} data
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
                )}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Kode Mapel <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                        placeholder="Contoh: MTK"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Kelompok <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="kelompok_a">Muatan Nasional (A)</option>
                                        <option value="kelompok_b">Muatan Kewilayahan (B)</option>
                                        <option value="kelompok_c1">Dasar Bidang Keahlian (C1)</option>
                                        <option value="kelompok_c2">Dasar Program Keahlian (C2)</option>
                                        <option value="kelompok_c3">Kompetensi Keahlian (C3)</option>
                                        <option value="mulok">Muatan Lokal</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nama Mata Pelajaran <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Matematika"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Jurusan (Opsional/Khusus)
                                </label>
                                <select
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                    className={cn(
                                        "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500",
                                        !isVocational && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={!isVocational}
                                >
                                    <option value="">-- Umum / Semua Jurusan --</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                                {!isVocational && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hhnya untuk mapel kejuruan (Kelompok C atau Mulok)
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deskripsi (Opsional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status Aktif
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
