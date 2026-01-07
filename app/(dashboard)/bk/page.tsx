'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    AlertTriangle,
    HeartHandshake,
    Plus,
    Search,
    BookOpen,
    Trash2,
    Edit2,
    Calendar,
    MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function BkPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('violations'); // violations, counseling, types

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Bimbingan & Konseling
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manajemen kedisiplinan dan konseling siswa
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('violations')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'violations'
                            ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Pelanggaran
                </button>
                <button
                    onClick={() => setActiveTab('counseling')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'counseling'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    <HeartHandshake className="w-4 h-4" />
                    Konseling
                </button>
                {['admin', 'super_admin', 'bk', 'guru'].includes(user?.role || '') && (
                    <button
                        onClick={() => setActiveTab('types')}
                        className={cn(
                            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                            activeTab === 'types'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        <BookOpen className="w-4 h-4" />
                        Jenis Pelanggaran
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'violations' && <ViolationsTab role={user?.role} />}
            {activeTab === 'counseling' && <CounselingTab role={user?.role} />}
            {activeTab === 'types' && <ViolationTypesTab role={user?.role} />}
        </div>
    );
}

// ==========================================
// VIOLATIONS TAB
// ==========================================
function ViolationsTab({ role }: { role?: string }) {
    const [violations, setViolations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchViolations();
    }, [search]);

    const fetchViolations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/bk/violations', { params: { search } });
            setViolations(response.data.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const canReport = ['admin', 'super_admin', 'guru', 'bk', 'wali_kelas'].includes(role || '');

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari siswa..."
                        className="pl-10 pr-4 py-2 border rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {canReport && (
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 hover:bg-red-700">
                        <Plus className="w-4 h-4" /> Lapor Pelanggaran
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Siswa</th>
                            <th className="px-6 py-4">Pelanggaran</th>
                            <th className="px-6 py-4 text-center">Poin</th>
                            <th className="px-6 py-4">Pelapor</th>
                            <th className="px-6 py-4">Tindak Lanjut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {violations.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(v.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 font-medium">
                                    {v.student.user.name}
                                    <div className="text-xs text-gray-500">{v.student.class?.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-red-600">{v.violation_type.name}</div>
                                    <div className="text-xs text-gray-500">{v.description}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-red-600">+{v.points_at_time}</td>
                                <td className="px-6 py-4 text-xs">{v.reporter?.name}</td>
                                <td className="px-6 py-4 text-xs italic">{v.follow_up || '-'}</td>
                            </tr>
                        ))}
                        {violations.length === 0 && !loading && (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Tidak ada data pelanggaran</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && <ReportViolationModal onClose={() => setShowModal(false)} onSuccess={() => { fetchViolations(); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// COUNSELING TAB
// ==========================================
function CounselingTab({ role }: { role?: string }) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/bk/counseling');
            setSessions(response.data.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const canSchedule = ['admin', 'super_admin', 'guru', 'bk'].includes(role || '');

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {canSchedule && (
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Jadwalkan Konseling
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <span className={cn(
                                "px-2 py-1 rounded-lg text-xs font-semibold uppercase",
                                session.type === 'pribadi' ? 'bg-purple-100 text-purple-700' :
                                    session.type === 'belajar' ? 'bg-yellow-100 text-yellow-700' :
                                        session.type === 'karir' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            )}>
                                {session.type}
                            </span>
                            <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                session.status === 'completed' ? 'bg-gray-100 text-gray-600 line-through' : 'bg-green-100 text-green-600'
                            )}>
                                {session.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{session.student.user.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(session.scheduled_at)}
                        </div>

                        {session.topic && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-sm mb-3">
                                <span className="font-semibold block text-xs uppercase text-gray-400 mb-1">Topik</span>
                                {session.topic}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                            <HeartHandshake className="w-3 h-3" />
                            Konselor: {session.counselor?.name}
                        </div>
                    </div>
                ))}
                {sessions.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500">Belum ada jadwal konseling</div>
                )}
            </div>

            {showModal && <ScheduleCounselingModal onClose={() => setShowModal(false)} onSuccess={() => { fetchSessions(); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// VIOLATION TYPES TAB
// ==========================================
function ViolationTypesTab({ role }: { role?: string }) {
    const [types, setTypes] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', points: 0, category: 'ringan', description: '' });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        api.get('/bk/violation-types').then(res => setTypes(res.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/bk/violation-types', formData);
            toast.success('Jenis pelanggaran ditambahkan');
            const res = await api.get('/bk/violation-types');
            setTypes(res.data.data);
            setShowModal(false);
            setFormData({ name: '', points: 0, category: 'ringan', description: '' });
        } catch (error) {
            toast.error('Gagal menyimpan');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus jenis pelanggaran ini?')) return;
        try {
            await api.delete(`/bk/violation-types/${id}`);
            setTypes(types.filter(t => t.id !== id));
            toast.success('Dihapus');
        } catch (e) { toast.error('Gagal hapus'); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700">
                    <Plus className="w-4 h-4" /> Tambah Jenis
                </button>
            </div>

            <div className="grid gap-4">
                {types.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full',
                                    t.category === 'berat' ? 'bg-red-500' : t.category === 'sedang' ? 'bg-orange-500' : 'bg-yellow-500'
                                )}></span>
                                <h4 className="font-bold">{t.name}</h4>
                                <span className="bg-gray-100 text-xs px-2 py-0.5 rounded text-gray-600">{t.points} Poin</span>
                            </div>
                            <p className="text-sm text-gray-500 ml-4">{t.description}</p>
                        </div>
                        <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Tambah Jenis Pelanggaran</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Nama Pelanggaran" className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <div className="flex gap-4">
                                <input required type="number" placeholder="Poin" className="w-1/3 px-4 py-2 border rounded-xl" value={formData.points} onChange={e => setFormData({ ...formData, points: Number(e.target.value) })} />
                                <select className="w-2/3 px-4 py-2 border rounded-xl" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="ringan">Ringan</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="berat">Berat</option>
                                </select>
                            </div>
                            <textarea placeholder="Deskripsi" className="w-full px-4 py-2 border rounded-xl" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// MODALS
// ==========================================

function ReportViolationModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [types, setTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        violation_type_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        follow_up: ''
    });

    useEffect(() => {
        api.get('/bk/violation-types').then(res => setTypes(res.data.data));
        api.get('/lookup/classes').then(res => setClasses(res.data.data));
    }, []);

    useEffect(() => {
        if (selectedClass) {
            api.get(`/lookup/students?class_id=${selectedClass}`).then(res => setStudents(res.data.data));
        } else {
            setStudents([]);
        }
    }, [selectedClass]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/bk/violations', formData);
            toast.success('Pelanggaran dilaporkan');
            onSuccess();
        } catch (e) { toast.error('Gagal lapor'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Lapor Pelanggaran</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kelas</label>
                        <select className="w-full px-4 py-2 border rounded-xl" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Siswa</label>
                        <select required className="w-full px-4 py-2 border rounded-xl" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} disabled={!selectedClass}>
                            <option value="">Pilih Siswa</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jenis Pelanggaran</label>
                        <select required className="w-full px-4 py-2 border rounded-xl" value={formData.violation_type_id} onChange={e => setFormData({ ...formData, violation_type_id: e.target.value })}>
                            <option value="">Pilih Jenis</option>
                            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.points} Poin)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tanggal</label>
                        <input required type="date" className="w-full px-4 py-2 border rounded-xl" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <textarea placeholder="Keterangan tambahan..." className="w-full px-4 py-2 border rounded-xl" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    <textarea placeholder="Tindak Lanjut (Opsional)" className="w-full px-4 py-2 border rounded-xl" value={formData.follow_up} onChange={e => setFormData({ ...formData, follow_up: e.target.value })} />

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-xl">Lapor</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ScheduleCounselingModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        type: 'pribadi',
        scheduled_at: '',
        topic: ''
    });

    useEffect(() => {
        api.get('/lookup/classes').then(res => setClasses(res.data.data));
    }, []);

    useEffect(() => {
        if (selectedClass) {
            api.get(`/lookup/students?class_id=${selectedClass}`).then(res => setStudents(res.data.data));
        } else {
            setStudents([]);
        }
    }, [selectedClass]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/bk/counseling', formData);
            toast.success('Jadwal dibuat');
            onSuccess();
        } catch (e) { toast.error('Gagal jadwal'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Jadwal Konseling</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kelas</label>
                        <select className="w-full px-4 py-2 border rounded-xl" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Siswa</label>
                        <select required className="w-full px-4 py-2 border rounded-xl" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} disabled={!selectedClass}>
                            <option value="">Pilih Siswa</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jenis Konseling</label>
                        <select required className="w-full px-4 py-2 border rounded-xl" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                            <option value="pribadi">Pribadi</option>
                            <option value="belajar">Belajar</option>
                            <option value="sosial">Sosial</option>
                            <option value="karir">Karir</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Waktu</label>
                        <input required type="datetime-local" className="w-full px-4 py-2 border rounded-xl" value={formData.scheduled_at} onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} />
                    </div>
                    <textarea placeholder="Topik / Permasalahan..." className="w-full px-4 py-2 border rounded-xl" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} />

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Simpan Jadwal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
