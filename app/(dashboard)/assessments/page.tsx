'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    FileText,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    BookOpen,
    ClipboardList,
    BarChart3,
    X,
    Loader2,
    Save,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Assessment {
    id: number;
    name: string;
    type: string;
    type_label: string;
    category: string;
    max_score: number;
    weight: number;
    date: string;
    is_published: boolean;
    student_grades_count: number;
    class_subject: {
        class: { id: number; name: string };
        subject: { id: number; name: string; code: string };
    };
    creator: { name: string };
}

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classes: any[];
    activeSemesterId: number | null;
    editData?: Assessment | null;
}

// ============================================================================
// CREATE/EDIT ASSESSMENT MODAL
// ============================================================================
function AssessmentFormModal({ isOpen, onClose, onSuccess, classes, activeSemesterId, editData }: AssessmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingSubjects, setFetchingSubjects] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const isEdit = !!editData;

    const [formData, setFormData] = useState({
        name: '',
        type: 'formatif',
        class_id: '',
        class_subject_id: '',
        date: new Date().toISOString().split('T')[0],
        max_score: 100,
        weight: 1,
        description: '',
        is_published: false,
    });

    // Reset / populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                // Editing mode - populate with existing data
                setFormData({
                    name: editData.name,
                    type: editData.type,
                    class_id: editData.class_subject?.class?.id?.toString() || '',
                    class_subject_id: '', // Will be set after subjects load
                    date: editData.date?.split('T')[0] || new Date().toISOString().split('T')[0],
                    max_score: editData.max_score,
                    weight: editData.weight,
                    description: '',
                    is_published: editData.is_published,
                });
            } else {
                // Create mode - reset form
                setFormData({
                    name: '',
                    type: 'formatif',
                    class_id: '',
                    class_subject_id: '',
                    date: new Date().toISOString().split('T')[0],
                    max_score: 100,
                    weight: 1,
                    description: '',
                    is_published: false,
                });
            }
            setSubjects([]);
        }
    }, [isOpen, editData]);

    // Fetch subjects when class changes
    useEffect(() => {
        if (formData.class_id) {
            fetchClassSubjects(formData.class_id);
        } else {
            setSubjects([]);
        }
    }, [formData.class_id]);

    const fetchClassSubjects = async (classId: string) => {
        setFetchingSubjects(true);
        try {
            const response = await api.get(`/classes/${classId}`);
            const classSubjects = response.data.data.class_subjects || [];

            const formattedSubjects = classSubjects.map((cs: any) => ({
                id: cs.id,
                name: cs.subject.name,
                code: cs.subject.code,
            }));

            setSubjects(formattedSubjects);

            // If editing, try to find and set the class_subject_id
            if (editData && editData.class_subject) {
                const matchingSubject = formattedSubjects.find(
                    (s: any) => s.name === editData.class_subject.subject.name
                );
                if (matchingSubject) {
                    setFormData(prev => ({ ...prev, class_subject_id: matchingSubject.id.toString() }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            toast.error('Gagal memuat mata pelajaran');
        } finally {
            setFetchingSubjects(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEdit && !activeSemesterId) {
            toast.error('Semester aktif tidak ditemukan. Harap hubungi admin.');
            return;
        }

        if (!isEdit && !formData.class_subject_id) {
            toast.error('Silakan pilih mata pelajaran');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                // Update existing
                await api.put(`/assessments/${editData.id}`, {
                    name: formData.name,
                    type: formData.type,
                    date: formData.date,
                    max_score: formData.max_score,
                    weight: formData.weight,
                    description: formData.description,
                    is_published: formData.is_published,
                });
                toast.success('Penilaian berhasil diperbarui');
            } else {
                // Create new
                await api.post('/assessments', {
                    ...formData,
                    semester_id: activeSemesterId,
                });
                toast.success('Penilaian berhasil dibuat');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save assessment:', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan penilaian');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Penilaian' : 'Buat Penilaian Baru'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Class Selection - Only for Create */}
                            {!isEdit && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Kelas <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.class_id}
                                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value, class_subject_id: '' })}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Kelas</option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Mata Pelajaran <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.class_subject_id}
                                                onChange={(e) => setFormData({ ...formData, class_subject_id: e.target.value })}
                                                disabled={!formData.class_id || fetchingSubjects}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                <option value="">Pilih Mata Pelajaran</option>
                                                {subjects.map((sub) => (
                                                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                                                ))}
                                            </select>
                                            {fetchingSubjects && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Show class/subject info when editing */}
                            {isEdit && (
                                <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelas & Mata Pelajaran</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {editData?.class_subject?.class?.name} - {editData?.class_subject?.subject?.name}
                                    </p>
                                </div>
                            )}

                            {/* Assessment Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Penilaian <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Ulangan Harian Bab 1"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Type and Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipe Penilaian <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="formatif">Formatif</option>
                                    <option value="sumatif">Sumatif</option>
                                    <option value="pts">PTS</option>
                                    <option value="pas">PAS</option>
                                    <option value="praktik">Praktik</option>
                                    <option value="proyek">Proyek</option>
                                    <option value="portofolio">Portofolio</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Max Score and Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nilai Maksimal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.max_score}
                                    onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bobot
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Published Status - Only for Edit */}
                            {isEdit && (
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Publikasikan nilai ke siswa
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Deskripsi (Opsional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="assessment-form"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEdit ? 'Simpan Perubahan' : 'Simpan Penilaian'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// VIEW ASSESSMENT MODAL
// ============================================================================
function ViewAssessmentModal({ isOpen, onClose, assessmentId }: { isOpen: boolean; onClose: () => void; assessmentId: number | null }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && assessmentId) {
            fetchDetail();
        }
    }, [isOpen, assessmentId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/assessments/${assessmentId}`);
            setData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
            toast.error('Gagal memuat detail penilaian');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Penilaian</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* Assessment Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm text-gray-500">Nama</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{data.assessment.name}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm text-gray-500">Kelas</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{data.assessment.class}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm text-gray-500">Mata Pelajaran</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{data.assessment.subject}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm text-gray-500">Tipe</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{data.assessment.type_label}</p>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-blue-600">{data.statistics.total_students}</p>
                                    <p className="text-sm text-gray-500">Total Siswa</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-green-600">{data.statistics.graded}</p>
                                    <p className="text-sm text-gray-500">Sudah Dinilai</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-purple-600">{data.statistics.average?.toFixed(1) || '-'}</p>
                                    <p className="text-sm text-gray-500">Rata-rata</p>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-amber-600">{data.statistics.highest || '-'}</p>
                                    <p className="text-sm text-gray-500">Tertinggi</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-red-600">{data.statistics.lowest || '-'}</p>
                                    <p className="text-sm text-gray-500">Terendah</p>
                                </div>
                            </div>

                            {/* Student Grades Table */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daftar Nilai Siswa</h3>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NIS</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {data.students.map((student: any, index: number) => (
                                                <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{student.nis}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{student.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {student.score !== null ? (
                                                            <span className={cn(
                                                                'px-3 py-1 rounded-full text-sm font-medium',
                                                                student.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            )}>
                                                                {student.score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{student.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Data tidak ditemukan</div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================
function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading, assessmentName }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    assessmentName: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Penilaian</h3>
                            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                        Apakah Anda yakin ingin menghapus penilaian <strong>"{assessmentName}"</strong>?
                    </p>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// INPUT GRADES MODAL
// ============================================================================
function InputGradesModal({ isOpen, onClose, assessment, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    assessment: Assessment | null;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && assessment) {
            fetchGrades();
        }
    }, [isOpen, assessment]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/assessments/${assessment!.id}`);
            // The API returns 'students' array with score/notes mixed in
            // We need to map it to a mutable state
            const studentData = response.data.data.students.map((s: any) => ({
                student_id: s.student_id,
                nis: s.nis,
                name: s.name,
                score: s.score ?? '', // default to empty string if null
                notes: s.notes ?? ''
            }));
            setStudents(studentData);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            toast.error('Gagal memuat data nilai');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId: number, value: string) => {
        // Allow empty string or numbers
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= (assessment?.max_score || 100))) {
            setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, score: value } : s));
        }
    };

    const handleNotesChange = (studentId: number, value: string) => {
        setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, notes: value } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Filter out students with empty scores ONLY if you want to support partial saving?
            // Or better: Send ALL valid scores.
            const gradesToSubmit = students
                .map(s => ({
                    student_id: s.student_id,
                    score: s.score === '' ? null : Number(s.score),
                    notes: s.notes
                }))
                .filter(s => s.score !== null); // Only send graded students? Or send null to clear grade? 
            // The backend requires score to be numeric. If we want to CLEAR a grade, we might need to handle null.
            // Checking backend validation: 'score' => 'required|numeric'
            // LIMITATION: Backend doesn't support clearing grades easily via this endpoint if 'required'. 
            // For now, only submit filled scores.

            if (gradesToSubmit.length === 0) {
                toast.warning('Belum ada nilai yang diisi');
                setSaving(false);
                return;
            }

            await api.post(`/assessments/${assessment!.id}/grades`, {
                grades: gradesToSubmit
            });
            toast.success('Nilai berhasil disimpan');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save grades:', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan nilai');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Input Nilai</h2>
                        <p className="text-sm text-gray-500">{assessment?.name} - {assessment?.class_subject?.class?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <form id="grade-form" onSubmit={handleSubmit}>
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NIS</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-32">Nilai (0-{assessment?.max_score})</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {students.map((student, index) => (
                                        <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{student.nis}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{student.name}</td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={assessment?.max_score}
                                                    value={student.score}
                                                    onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={student.notes}
                                                    onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Catatan..."
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </form>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="grade-form"
                        disabled={saving || loading}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Nilai
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AssessmentsPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 15,
    });
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        class_id: '',
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editData, setEditData] = useState<Assessment | null>(null);
    const [viewAssessmentId, setViewAssessmentId] = useState<number | null>(null);
    const [deleteData, setDeleteData] = useState<Assessment | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Input Grade Modal
    const [showInputGradeModal, setShowInputGradeModal] = useState(false);
    const [inputGradeAssessment, setInputGradeAssessment] = useState<Assessment | null>(null);

    useEffect(() => {
        fetchClasses();
        fetchActiveSemester();
        fetchAssessments();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchAssessments();
        }, 300);
        return () => clearTimeout(debounce);
    }, [filters, pagination.currentPage]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/lookup/classes');
            setClasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchActiveSemester = async () => {
        try {
            const response = await api.get('/lookup/semesters');
            const active = response.data.data.find((s: any) => s.is_active);
            if (active) {
                setActiveSemesterId(active.id);
            }
        } catch (error) {
            console.error('Failed to fetch semester:', error);
        }
    };

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                per_page: pagination.perPage.toString(),
                ...(filters.type && { type: filters.type }),
                ...(filters.class_id && { class_id: filters.class_id }),
            });

            const response = await api.get(`/assessments?${params}`);
            const result = response.data.data;

            setAssessments(result.data);
            setPagination({
                currentPage: result.current_page,
                lastPage: result.last_page,
                total: result.total,
                perPage: result.per_page,
            });
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditData(null);
        setShowFormModal(true);
    };

    const handleEdit = (assessment: Assessment) => {
        setEditData(assessment);
        setShowFormModal(true);
    };

    const handleView = (assessment: Assessment) => {
        setViewAssessmentId(assessment.id);
        setShowViewModal(true);
    };

    const handleDeleteClick = (assessment: Assessment) => {
        setShowDeleteModal(true);
    };

    const handleInputGradesClick = (assessment: Assessment) => {
        setInputGradeAssessment(assessment);
        setShowInputGradeModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteData) return;

        setDeleting(true);
        try {
            await api.delete(`/assessments/${deleteData.id}`);
            toast.success('Penilaian berhasil dihapus');
            setShowDeleteModal(false);
            setDeleteData(null);
            fetchAssessments();
        } catch (error: any) {
            console.error('Failed to delete:', error);
            toast.error(error.response?.data?.message || 'Gagal menghapus penilaian');
        } finally {
            setDeleting(false);
        }
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            formatif: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            sumatif: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            pts: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            pas: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            praktik: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            proyek: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            portofolio: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        };
        return styles[type] || styles.formatif;
    };

    const assessmentTypes = [
        { value: 'formatif', label: 'Formatif' },
        { value: 'sumatif', label: 'Sumatif' },
        { value: 'pts', label: 'PTS' },
        { value: 'pas', label: 'PAS' },
        { value: 'praktik', label: 'Praktik' },
        { value: 'proyek', label: 'Proyek' },
        { value: 'portofolio', label: 'Portofolio' },
    ];

    return (
        <div className="space-y-6">
            {/* Modals */}
            <AssessmentFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditData(null); }}
                onSuccess={fetchAssessments}
                classes={classes}
                activeSemesterId={activeSemesterId}
                editData={editData}
            />

            <ViewAssessmentModal
                isOpen={showViewModal}
                onClose={() => { setShowViewModal(false); setViewAssessmentId(null); }}
                assessmentId={viewAssessmentId}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeleteData(null); }}
                onConfirm={handleDeleteConfirm}
                loading={deleting}
                assessmentName={deleteData?.name || ''}
            />



            <InputGradesModal
                isOpen={showInputGradeModal}
                onClose={() => { setShowInputGradeModal(false); setInputGradeAssessment(null); }}
                assessment={inputGradeAssessment}
                onSuccess={fetchAssessments}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Penilaian
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kelola penilaian dan input nilai siswa
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 w-fit"
                >
                    <Plus className="w-4 h-4" />
                    <span>Buat Penilaian</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</div>
                            <div className="text-sm text-gray-500">Total Penilaian</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {assessments.filter(a => a.is_published).length}
                            </div>
                            <div className="text-sm text-gray-500">Dipublikasi</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {assessments.filter(a => a.type === 'sumatif' || a.type === 'pts' || a.type === 'pas').length}
                            </div>
                            <div className="text-sm text-gray-500">Sumatif</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {assessments.reduce((sum, a) => sum + a.student_grades_count, 0)}
                            </div>
                            <div className="text-sm text-gray-500">Nilai Terisi</div>
                        </div>
                    </div>
                </div>
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
                            placeholder="Cari nama penilaian..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.class_id}
                            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none"
                        >
                            <option value="">Semua Tipe</option>
                            {assessmentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Assessment List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tidak ada data penilaian</p>
                        <p className="text-sm">Buat penilaian baru untuk memulai</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Penilaian
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Kelas
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Tipe
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                                            Progress
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {assessments.map((assessment) => (
                                        <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {assessment.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {assessment.class_subject?.subject?.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                                                    {assessment.class_subject?.class?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'px-3 py-1 rounded-full text-xs font-medium',
                                                    getTypeBadge(assessment.type)
                                                )}>
                                                    {assessment.type_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {assessment.date ? new Date(assessment.date).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {assessment.student_grades_count} nilai
                                                    </span>
                                                    {assessment.is_published ? (
                                                        <span className="text-xs text-green-600">Dipublikasi</span>
                                                    ) : (
                                                        <span className="text-xs text-yellow-600">Draft</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleInputGradesClick(assessment)}
                                                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                                                        title="Input Nilai"
                                                    >
                                                        <ClipboardList className="w-4 h-4 text-green-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleView(assessment)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(assessment)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(assessment)}
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

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Menampilkan {assessments.length} dari {pagination.total}
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
        </div>
    );
}
