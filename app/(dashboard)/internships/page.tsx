'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    Briefcase,
    Building2,
    Calendar,
    MapPin,
    Phone,
    User,
    Plus,
    CheckCircle,
    Clock,
    FileText,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function InternshipPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('internships'); // internships, partners, periods

    const isStudent = user?.role === 'siswa';
    const isStaff = ['admin', 'super_admin', 'hubin', 'guru'].includes(user?.role || '');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        PKL / Prakerin
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isStudent ? 'Data PKL dan Jurnal Kegiatan' : 'Manajemen Praktik Kerja Lapangan'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('internships')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'internships'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                >
                    <Briefcase className="w-4 h-4" />
                    {isStudent ? 'PKL Saya' : 'Data PKL Siswa'}
                </button>
                {isStaff && (
                    <>
                        <button
                            onClick={() => setActiveTab('partners')}
                            className={cn(
                                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                                activeTab === 'partners'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Building2 className="w-4 h-4" />
                            Mitra Industri
                        </button>
                        <button
                            onClick={() => setActiveTab('periods')}
                            className={cn(
                                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                                activeTab === 'periods'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            Periode PKL
                        </button>
                    </>
                )}
            </div>

            {activeTab === 'internships' && <InternshipsTab isStudent={isStudent} isStaff={isStaff} />}
            {activeTab === 'partners' && isStaff && <PartnersTab />}
            {activeTab === 'periods' && isStaff && <PeriodsTab />}
        </div>
    );
}

// ==========================================
// INTERNSHIPS TAB
// ==========================================
function InternshipsTab({ isStudent, isStaff }: { isStudent: boolean, isStaff: boolean }) {
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchInternships();
    }, []);

    const fetchInternships = async () => {
        setLoading(true);
        try {
            const res = await api.get('/internships');
            setInternships(res.data.data.data || res.data.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    if (selectedId) {
        return <JournalView internshipId={selectedId} onBack={() => setSelectedId(null)} isStudent={isStudent} />;
    }

    return (
        <div className="space-y-4">
            {isStaff && (
                <div className="flex justify-end">
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Daftarkan PKL
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {internships.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border p-5 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold capitalize",
                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    item.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                        item.status === 'approved' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                            )}>
                                {item.status}
                            </span>
                            {item.final_score && (
                                <span className="text-lg font-bold text-green-600">{item.final_score}</span>
                            )}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{item.partner?.name}</h3>
                        {!isStudent && (
                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                <User className="w-3 h-3" /> {item.student?.user?.name}
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {item.period?.name}
                        </p>

                        <div className="pt-4 border-t flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                Pembimbing: {item.supervisor?.name || '-'}
                            </span>
                            <button
                                onClick={() => setSelectedId(item.id)}
                                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                            >
                                Jurnal <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {internships.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500">Belum ada data PKL</div>
                )}
            </div>

            {showModal && <AddInternshipModal onClose={() => setShowModal(false)} onSuccess={() => { fetchInternships(); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// JOURNAL VIEW
// ==========================================
function JournalView({ internshipId, onBack, isStudent }: { internshipId: number, onBack: () => void, isStudent: boolean }) {
    const [journals, setJournals] = useState<any[]>([]);
    const [formData, setFormData] = useState({ date: '', activities: '', notes: '' });

    useEffect(() => {
        fetchJournals();
    }, [internshipId]);

    const fetchJournals = async () => {
        try {
            const res = await api.get(`/internships/${internshipId}/journals`);
            setJournals(res.data.data);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/internships/${internshipId}/journals`, formData);
            toast.success('Jurnal disimpan');
            setFormData({ date: '', activities: '', notes: '' });
            fetchJournals();
        } catch (e) { toast.error('Gagal simpan jurnal'); }
    };

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                ← Kembali
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Input Jurnal */}
                {isStudent && (
                    <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Input Jurnal Harian</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium block mb-1">Tanggal</label>
                                <input type="date" required className="w-full px-4 py-2 border rounded-xl" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium block mb-1">Kegiatan</label>
                                <textarea required rows={4} className="w-full px-4 py-2 border rounded-xl" placeholder="Jelaskan kegiatan hari ini..." value={formData.activities} onChange={e => setFormData({ ...formData, activities: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-medium block mb-1">Catatan</label>
                                <textarea rows={2} className="w-full px-4 py-2 border rounded-xl" placeholder="Catatan tambahan (opsional)" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Simpan Jurnal</button>
                        </form>
                    </div>
                )}

                {/* List Jurnal */}
                <div className={cn("space-y-4", !isStudent && "lg:col-span-2")}>
                    <h3 className="font-bold">Riwayat Jurnal</h3>
                    {journals.map((j) => (
                        <div key={j.id} className="bg-white p-4 rounded-xl border">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900">{formatDateTime(j.date)}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                    j.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        j.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                )}>{j.status}</span>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{j.activities}</p>
                            {j.feedback && (
                                <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs text-gray-500">Feedback: {j.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {journals.length === 0 && <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">Belum ada jurnal</div>}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// PARTNERS TAB
// ==========================================
function PartnersTab() {
    const [partners, setPartners] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        api.get('/internships/partners').then(res => setPartners(res.data.data));
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700">
                    <Plus className="w-4 h-4" /> Tambah Mitra
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p) => (
                    <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border p-5">
                        <Building2 className="w-8 h-8 text-green-600 mb-3" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{p.name}</h3>
                        <div className="space-y-1 text-sm text-gray-500">
                            {p.city && <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {p.city}</p>}
                            {p.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {p.phone}</p>}
                            {p.contact_person && <p className="flex items-center gap-2"><User className="w-3 h-3" /> {p.contact_person}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && <AddPartnerModal onClose={() => setShowModal(false)} onSuccess={() => { api.get('/internships/partners').then(res => setPartners(res.data.data)); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// PERIODS TAB
// ==========================================
function PeriodsTab() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        api.get('/internships/periods').then(res => setPeriods(res.data.data));
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700">
                    <Plus className="w-4 h-4" /> Tambah Periode
                </button>
            </div>

            <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left">Nama Periode</th>
                            <th className="px-6 py-4 text-left">Tanggal Mulai</th>
                            <th className="px-6 py-4 text-left">Tanggal Selesai</th>
                            <th className="px-6 py-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {periods.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{p.name}</td>
                                <td className="px-6 py-4">{formatDateTime(p.start_date)}</td>
                                <td className="px-6 py-4">{formatDateTime(p.end_date)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs", p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                                        {p.is_active ? 'Aktif' : 'Selesai'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <AddPeriodModal onClose={() => setShowModal(false)} onSuccess={() => { api.get('/internships/periods').then(res => setPeriods(res.data.data)); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// MODALS
// ==========================================
function AddPartnerModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', city: '', phone: '', contact_person: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/internships/partners', formData);
            toast.success('Mitra ditambahkan');
            onSuccess();
        } catch (e) { toast.error('Gagal tambah mitra'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Tambah Mitra Industri</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Nama Perusahaan/Industri" className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <input placeholder="Kota" className="w-full px-4 py-2 border rounded-xl" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    <input placeholder="No. Telepon" className="w-full px-4 py-2 border rounded-xl" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    <input placeholder="Contact Person" className="w-full px-4 py-2 border rounded-xl" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddPeriodModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '', is_active: true });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/internships/periods', formData);
            toast.success('Periode ditambahkan');
            onSuccess();
        } catch (e) { toast.error('Gagal tambah periode'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Tambah Periode PKL</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Nama Periode (misal: PKL Genap 2025)" className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs block mb-1">Tanggal Mulai</label>
                            <input type="date" required className="w-full px-4 py-2 border rounded-xl" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs block mb-1">Tanggal Selesai</label>
                            <input type="date" required className="w-full px-4 py-2 border rounded-xl" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddInternshipModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [partners, setPartners] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [formData, setFormData] = useState({ student_id: '', period_id: '', partner_id: '', supervisor_id: '' });

    useEffect(() => {
        api.get('/internships/partners').then(res => setPartners(res.data.data));
        api.get('/internships/periods').then(res => setPeriods(res.data.data));
        api.get('/lookup/students').then(res => setStudents(res.data.data));
        api.get('/lookup/teachers').then(res => setTeachers(res.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/internships', formData);
            toast.success('Data PKL disimpan');
            onSuccess();
        } catch (e) { toast.error('Gagal simpan'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold mb-4">Daftarkan Siswa PKL</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                        <option value="">Pilih Siswa</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.user?.name || s.name}</option>)}
                    </select>
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.period_id} onChange={e => setFormData({ ...formData, period_id: e.target.value })}>
                        <option value="">Pilih Periode</option>
                        {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.partner_id} onChange={e => setFormData({ ...formData, partner_id: e.target.value })}>
                        <option value="">Pilih Mitra Industri</option>
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="w-full px-4 py-2 border rounded-xl" value={formData.supervisor_id} onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}>
                        <option value="">Pilih Pembimbing (Opsional)</option>
                        {teachers.map(t => <option key={t.id} value={t.user_id}>{t.user?.name || t.name}</option>)}
                    </select>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
