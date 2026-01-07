'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    BookOpen,
    FileText,
    Upload,
    Plus,
    Pencil,
    Trash,
    Download,
    ChevronDown,
    ChevronRight,
    Layers,
    Target,
    FolderTree,
    X
} from 'lucide-react';
import { toast } from 'sonner';

export default function CurriculumPage() {
    const { user } = useAuthStore();
    const isAdmin = ['admin', 'super_admin', 'wakil_kepala'].includes(user?.role || '');
    const isTeacher = user?.role === 'guru';
    const canEdit = isAdmin || isTeacher;

    const [activeTab, setActiveTab] = useState('learning-outcomes');

    const tabs = [
        { id: 'learning-outcomes', label: 'Capaian Pembelajaran', icon: Target },
        { id: 'competencies', label: 'Kompetensi Dasar', icon: Layers },
        { id: 'structures', label: 'Struktur Kurikulum', icon: FolderTree },
        { id: 'documents', label: 'Dokumen Kurikulum', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Manajemen Kurikulum
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Capaian Pembelajaran, Kompetensi Dasar, dan Dokumen Kurikulum
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'learning-outcomes' && <LearningOutcomesTab canEdit={canEdit} />}
            {activeTab === 'competencies' && <CompetenciesTab canEdit={canEdit} />}
            {activeTab === 'structures' && <StructuresTab canEdit={isAdmin} />}
            {activeTab === 'documents' && <DocumentsTab canEdit={canEdit} />}
        </div>
    );
}

// ==========================================
// LEARNING OUTCOMES TAB (Capaian Pembelajaran)
// ==========================================
function LearningOutcomesTab({ canEdit }: { canEdit: boolean }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterPhase, setFilterPhase] = useState('');

    useEffect(() => {
        loadData();
        api.get('/subjects').then(r => setSubjects(r.data.data.data || r.data.data));
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSubject) params.append('subject_id', filterSubject);
            if (filterPhase) params.append('phase', filterPhase);
            const res = await api.get(`/curriculum/learning-outcomes?${params.toString()}`);
            setData(res.data.data.data || res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filterSubject, filterPhase]);

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus Capaian Pembelajaran ini?')) return;
        try {
            await api.delete(`/curriculum/learning-outcomes/${id}`);
            toast.success('CP dihapus');
            loadData();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    const phases = ['E', 'F']; // SMK uses Phase E (Class 10) and F (Class 11-12)

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <select
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                >
                    <option value="">Semua Mata Pelajaran</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
                <select
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                    value={filterPhase}
                    onChange={e => setFilterPhase(e.target.value)}
                >
                    <option value="">Semua Fase</option>
                    {phases.map(p => <option key={p} value={p}>Fase {p}</option>)}
                </select>
                {canEdit && (
                    <button
                        onClick={() => { setEditItem(null); setShowModal(true); }}
                        className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Tambah CP
                    </button>
                )}
            </div>

            {/* Data Grid */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Belum ada data Capaian Pembelajaran</div>
                ) : (
                    data.map((item) => (
                        <div key={item.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                        Fase {item.phase}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {item.subject?.code} - {item.subject?.name}
                                    </span>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                            {item.element && <p className="text-sm font-semibold text-gray-700 mb-2">Elemen: {item.element}</p>}
                            <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
                            {item.basic_competencies?.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-500 mb-1">{item.basic_competencies.length} Kompetensi Dasar</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <LearningOutcomeModal
                    initialData={editItem}
                    subjects={subjects}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { loadData(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

// ==========================================
// COMPETENCIES TAB (Kompetensi Dasar)
// ==========================================
function CompetenciesTab({ canEdit }: { canEdit: boolean }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
    const [filterLO, setFilterLO] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    useEffect(() => {
        api.get('/curriculum/learning-outcomes?per_page=100').then(r => setLearningOutcomes(r.data.data.data || r.data.data));
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = filterLO ? `?learning_outcome_id=${filterLO}` : '';
            const res = await api.get(`/curriculum/competencies${params}`);
            setData(res.data.data.data || res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filterLO]);

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus Kompetensi Dasar ini?')) return;
        try {
            await api.delete(`/curriculum/competencies/${id}`);
            toast.success('KD dihapus');
            loadData();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
                <select
                    className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[300px]"
                    value={filterLO}
                    onChange={e => setFilterLO(e.target.value)}
                >
                    <option value="">Semua Capaian Pembelajaran</option>
                    {learningOutcomes.map(lo => (
                        <option key={lo.id} value={lo.id}>
                            {lo.subject?.code} - Fase {lo.phase} {lo.element ? `(${lo.element})` : ''}
                        </option>
                    ))}
                </select>
                {canEdit && (
                    <button
                        onClick={() => { setEditItem(null); setShowModal(true); }}
                        className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4" /> Tambah KD
                    </button>
                )}
            </div>

            <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">Tipe</th>
                            <th className="px-4 py-3 text-left">Deskripsi</th>
                            <th className="px-4 py-3 text-left">Semester</th>
                            {canEdit && <th className="px-4 py-3 text-center w-24">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Belum ada data</td></tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono font-bold">{item.code}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs",
                                            item.type === 'knowledge' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                        )}>
                                            {item.type === 'knowledge' ? 'Pengetahuan' : 'Keterampilan'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-md truncate">{item.description}</td>
                                    <td className="px-4 py-3">{item.semester ? `Semester ${item.semester}` : '-'}</td>
                                    {canEdit && (
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <CompetencyModal
                    initialData={editItem}
                    learningOutcomes={learningOutcomes}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { loadData(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

// ==========================================
// STRUCTURES TAB (Struktur Kurikulum)
// ==========================================
function StructuresTab({ canEdit }: { canEdit: boolean }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [filterDept, setFilterDept] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    useEffect(() => {
        api.get('/lookup/departments').then(r => setDepartments(r.data.data));
        api.get('/lookup/academic-years').then(r => setAcademicYears(r.data.data));
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterDept) params.append('department_id', filterDept);
            if (filterGrade) params.append('grade', filterGrade);
            const res = await api.get(`/curriculum/structures?${params.toString()}`);
            setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filterDept, filterGrade]);

    // Group by group type
    const groupedData = data.reduce((acc: any, item) => {
        const key = item.group || 'A';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const groupLabels: Record<string, string> = {
        'A': 'Kelompok A (Umum)',
        'B': 'Kelompok B (Umum)',
        'C1': 'Kelompok C1 (Dasar Bidang Keahlian)',
        'C2': 'Kelompok C2 (Dasar Program Keahlian)',
        'C3': 'Kelompok C3 (Kompetensi Keahlian)',
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
                <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="">Semua Jurusan</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                    <option value="">Semua Kelas</option>
                    <option value="10">Kelas X</option>
                    <option value="11">Kelas XI</option>
                    <option value="12">Kelas XII</option>
                </select>
                {canEdit && (
                    <button
                        onClick={() => { setEditItem(null); setShowModal(true); }}
                        className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4" /> Tambah Struktur
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-10 text-gray-500">Belum ada struktur kurikulum</div>
            ) : (
                Object.keys(groupedData).sort().map(group => (
                    <div key={group} className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b font-semibold text-gray-700">
                            {groupLabels[group] || group}
                        </div>
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="px-4 py-2 text-left">Mata Pelajaran</th>
                                    <th className="px-4 py-2 text-left">Jurusan</th>
                                    <th className="px-4 py-2 text-center">Kelas</th>
                                    <th className="px-4 py-2 text-center">Semester</th>
                                    <th className="px-4 py-2 text-center">JP/Minggu</th>
                                    {canEdit && <th className="px-4 py-2 w-20"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {groupedData[group].map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium">{item.subject?.name}</td>
                                        <td className="px-4 py-2">{item.department?.name || 'Semua'}</td>
                                        <td className="px-4 py-2 text-center">{item.grade}</td>
                                        <td className="px-4 py-2 text-center">{item.semester}</td>
                                        <td className="px-4 py-2 text-center font-mono">{item.hours_per_week}</td>
                                        {canEdit && (
                                            <td className="px-4 py-2">
                                                <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Pencil className="w-4 h-4" /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}

            {showModal && (
                <StructureModal
                    initialData={editItem}
                    departments={departments}
                    academicYears={academicYears}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { loadData(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

// ==========================================
// DOCUMENTS TAB (Dokumen Kurikulum)
// ==========================================
function DocumentsTab({ canEdit }: { canEdit: boolean }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        api.get('/subjects').then(r => setSubjects(r.data.data.data || r.data.data));
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSubject) params.append('subject_id', filterSubject);
            if (filterType) params.append('type', filterType);
            const res = await api.get(`/curriculum/documents?${params.toString()}`);
            setData(res.data.data.data || res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filterSubject, filterType]);

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus dokumen ini?')) return;
        try {
            await api.delete(`/curriculum/documents/${id}`);
            toast.success('Dokumen dihapus');
            loadData();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    const typeLabels: Record<string, string> = {
        syllabus: 'Silabus',
        module: 'Modul Ajar',
        atp: 'Alur Tujuan Pembelajaran',
        rpp: 'RPP',
        other: 'Lainnya',
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
                <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                    <option value="">Semua Mata Pelajaran</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Semua Jenis</option>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="ml-auto px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 hover:bg-orange-700"
                    >
                        <Upload className="w-4 h-4" /> Upload Dokumen
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10">Loading...</div>
                ) : data.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Belum ada dokumen</div>
                ) : (
                    data.map((item) => (
                        <div key={item.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow group">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.subject?.name}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                        {typeLabels[item.type] || item.type}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <span className="text-xs text-gray-400">
                                    {item.uploader?.name} • {formatDateTime(item.created_at)}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL}/curriculum/documents/${item.id}/download`}
                                        target="_blank"
                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    {canEdit && (
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <DocumentUploadModal
                    subjects={subjects}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { loadData(); setShowModal(false); }}
                />
            )}
        </div>
    );
}

// ==========================================
// MODALS
// ==========================================

function LearningOutcomeModal({ initialData, subjects, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        subject_id: initialData?.subject_id || '',
        phase: initialData?.phase || 'E',
        element: initialData?.element || '',
        description: initialData?.description || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.put(`/curriculum/learning-outcomes/${initialData.id}`, formData);
                toast.success('CP diperbarui');
            } else {
                await api.post('/curriculum/learning-outcomes', formData);
                toast.success('CP ditambahkan');
            }
            onSuccess();
        } catch (e) { toast.error('Gagal menyimpan'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{initialData ? 'Edit' : 'Tambah'} Capaian Pembelajaran</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Mata Pelajaran *</label>
                        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                            <option value="">Pilih Mapel</option>
                            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Fase *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.phase} onChange={e => setFormData({ ...formData, phase: e.target.value })}>
                                <option value="E">Fase E (Kelas 10)</option>
                                <option value="F">Fase F (Kelas 11-12)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Elemen</label>
                            <input className="w-full px-3 py-2 border rounded-lg" placeholder="Elemen CP" value={formData.element} onChange={e => setFormData({ ...formData, element: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Deskripsi Capaian Pembelajaran *</label>
                        <textarea required rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Deskripsi lengkap CP..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CompetencyModal({ initialData, learningOutcomes, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        learning_outcome_id: initialData?.learning_outcome_id || '',
        code: initialData?.code || '',
        type: initialData?.type || 'knowledge',
        description: initialData?.description || '',
        semester: initialData?.semester || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.put(`/curriculum/competencies/${initialData.id}`, formData);
                toast.success('KD diperbarui');
            } else {
                await api.post('/curriculum/competencies', formData);
                toast.success('KD ditambahkan');
            }
            onSuccess();
        } catch (e) { toast.error('Gagal menyimpan'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{initialData ? 'Edit' : 'Tambah'} Kompetensi Dasar</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Capaian Pembelajaran *</label>
                        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.learning_outcome_id} onChange={e => setFormData({ ...formData, learning_outcome_id: e.target.value })}>
                            <option value="">Pilih CP</option>
                            {learningOutcomes.map((lo: any) => (
                                <option key={lo.id} value={lo.id}>
                                    {lo.subject?.code} - Fase {lo.phase} {lo.element ? `(${lo.element})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Kode *</label>
                            <input required className="w-full px-3 py-2 border rounded-lg" placeholder="3.1" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Tipe *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="knowledge">Pengetahuan</option>
                                <option value="skill">Keterampilan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Semester</label>
                            <select className="w-full px-3 py-2 border rounded-lg" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                <option value="">-</option>
                                <option value="1">1 (Ganjil)</option>
                                <option value="2">2 (Genap)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Deskripsi *</label>
                        <textarea required rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Deskripsi KD..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StructureModal({ initialData, departments, academicYears, onClose, onSuccess }: any) {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        subject_id: initialData?.subject_id || '',
        department_id: initialData?.department_id || '',
        academic_year_id: initialData?.academic_year_id || '',
        grade: initialData?.grade || '10',
        semester: initialData?.semester || '1',
        hours_per_week: initialData?.hours_per_week || '2',
        group: initialData?.group || 'A',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/subjects').then(r => setSubjects(r.data.data.data || r.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.put(`/curriculum/structures/${initialData.id}`, formData);
                toast.success('Struktur diperbarui');
            } else {
                await api.post('/curriculum/structures', formData);
                toast.success('Struktur ditambahkan');
            }
            onSuccess();
        } catch (e) { toast.error('Gagal menyimpan'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{initialData ? 'Edit' : 'Tambah'} Struktur Kurikulum</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Mata Pelajaran *</label>
                        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                            <option value="">Pilih Mapel</option>
                            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Jurusan</label>
                            <select className="w-full px-3 py-2 border rounded-lg" value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}>
                                <option value="">Semua Jurusan</option>
                                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Tahun Ajaran *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.academic_year_id} onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}>
                                <option value="">Pilih</option>
                                {academicYears.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Kelas *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                                <option value="10">X</option>
                                <option value="11">XI</option>
                                <option value="12">XII</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Semester *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">JP/Minggu *</label>
                            <input required type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={formData.hours_per_week} onChange={e => setFormData({ ...formData, hours_per_week: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Kelompok *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.group} onChange={e => setFormData({ ...formData, group: e.target.value })}>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                                <option value="C3">C3</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DocumentUploadModal({ subjects, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        subject_id: '',
        type: 'module',
        title: '',
        description: '',
        grade: '',
        semester: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Pilih file untuk diupload');
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });

            await api.post('/curriculum/documents', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Dokumen diupload');
            onSuccess();
        } catch (e) { toast.error('Gagal upload'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Upload Dokumen Kurikulum</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Mata Pelajaran *</label>
                        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                            <option value="">Pilih Mapel</option>
                            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Jenis Dokumen *</label>
                            <select required className="w-full px-3 py-2 border rounded-lg" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="syllabus">Silabus</option>
                                <option value="module">Modul Ajar</option>
                                <option value="atp">Alur Tujuan Pembelajaran</option>
                                <option value="rpp">RPP</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Judul *</label>
                            <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Judul dokumen" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium block mb-1">Kelas</label>
                            <select className="w-full px-3 py-2 border rounded-lg" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                                <option value="">-</option>
                                <option value="10">X</option>
                                <option value="11">XI</option>
                                <option value="12">XII</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium block mb-1">Semester</label>
                            <select className="w-full px-3 py-2 border rounded-lg" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                <option value="">-</option>
                                <option value="1">1 (Ganjil)</option>
                                <option value="2">2 (Genap)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Deskripsi</label>
                        <textarea rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Deskripsi opsional..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">File (PDF/DOC) *</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            required
                            className="w-full px-3 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Uploading...' : 'Upload'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
