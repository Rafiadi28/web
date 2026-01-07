'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    Activity,
    Plus,
    User,
    Clock,
    Pill,
    AlertCircle,
    CheckCircle,
    XCircle,
    Home,
    Ambulance,
    Search
} from 'lucide-react';
import { toast } from 'sonner';

export default function UksPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('visits'); // visits, medicines

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        UKS (Unit Kesehatan Sekolah)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Pencatatan kunjungan dan inventaris obat
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('visits')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'visits'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                >
                    <Activity className="w-4 h-4" />
                    Kunjungan UKS
                </button>
                <button
                    onClick={() => setActiveTab('medicines')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'medicines'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                >
                    <Pill className="w-4 h-4" />
                    Inventaris Obat
                </button>
            </div>

            {activeTab === 'visits' && <VisitsTab />}
            {activeTab === 'medicines' && <MedicinesTab />}
        </div>
    );
}

// ==========================================
// VISITS TAB
// ==========================================
function VisitsTab() {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<any>(null);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const res = await api.get('/uks/visits');
            setVisits(res.data.data.data || res.data.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'treated': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'sent_home': return <Home className="w-4 h-4 text-blue-500" />;
            case 'referred': return <Ambulance className="w-4 h-4 text-red-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'waiting': return 'Menunggu';
            case 'treated': return 'Ditangani';
            case 'sent_home': return 'Dipulangkan';
            case 'referred': return 'Dirujuk';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {visits.filter(v => v.status === 'waiting').length} Menunggu
                    </span>
                </div>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 hover:bg-red-700">
                    <Plus className="w-4 h-4" /> Catat Kunjungan
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left">Waktu</th>
                            <th className="px-6 py-4 text-left">Siswa</th>
                            <th className="px-6 py-4 text-left">Keluhan</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {visits.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{formatDateTime(v.visit_time)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium">{v.student?.user?.name}</div>
                                    <div className="text-xs text-gray-500">{v.student?.class?.name}</div>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate">{v.complaint}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit",
                                        v.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                            v.status === 'treated' ? 'bg-green-100 text-green-700' :
                                                v.status === 'sent_home' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                    )}>
                                        {getStatusIcon(v.status)} {getStatusLabel(v.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setSelectedVisit(v)} className="text-blue-600 hover:underline text-xs">
                                        {v.status === 'waiting' ? 'Tangani' : 'Detail'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {visits.length === 0 && !loading && (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Belum ada kunjungan hari ini</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && <AddVisitModal onClose={() => setShowModal(false)} onSuccess={() => { fetchVisits(); setShowModal(false); }} />}
            {selectedVisit && <HandleVisitModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} onSuccess={() => { fetchVisits(); setSelectedVisit(null); }} />}
        </div>
    );
}

// ==========================================
// MEDICINES TAB
// ==========================================
function MedicinesTab() {
    const [medicines, setMedicines] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/uks/medicines');
            setMedicines(res.data.data);
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus obat ini?')) return;
        try {
            await api.delete(`/uks/medicines/${id}`);
            toast.success('Obat dihapus');
            fetchMedicines();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700">
                    <Plus className="w-4 h-4" /> Tambah Obat
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {medicines.map((m) => (
                    <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center group relative">
                        <Pill className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{m.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">{m.type || 'Umum'}</p>
                        <div className={cn(
                            "text-lg font-bold",
                            m.stock < 10 ? 'text-red-600' : 'text-green-600'
                        )}>
                            {m.stock}
                        </div>
                        <p className="text-[10px] text-gray-400">Stok</p>
                        {m.expiry_date && (
                            <p className="text-[10px] text-red-500 mt-2">Exp: {formatDateTime(m.expiry_date)}</p>
                        )}
                        <button
                            onClick={() => handleDelete(m.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 text-xs"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {showModal && <AddMedicineModal onClose={() => setShowModal(false)} onSuccess={() => { fetchMedicines(); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// MODALS
// ==========================================
function AddVisitModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [students, setStudents] = useState<any[]>([]);
    const [formData, setFormData] = useState({ student_id: '', complaint: '' });

    useEffect(() => {
        api.get('/lookup/students').then(res => setStudents(res.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/uks/visits', formData);
            toast.success('Kunjungan dicatat');
            onSuccess();
        } catch (e) { toast.error('Gagal mencatat'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Catat Kunjungan UKS</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                        <option value="">Pilih Siswa</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.user?.name || s.name}</option>)}
                    </select>
                    <textarea required rows={3} placeholder="Keluhan siswa..." className="w-full px-4 py-2 border rounded-xl" value={formData.complaint} onChange={e => setFormData({ ...formData, complaint: e.target.value })} />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function HandleVisitModal({ visit, onClose, onSuccess }: { visit: any, onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        diagnosis: visit.diagnosis || '',
        treatment: visit.treatment || '',
        medication_given: visit.medication_given || '',
        status: visit.status || 'treated',
        notes: visit.notes || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/uks/visits/${visit.id}`, formData);
            toast.success('Data diperbarui');
            onSuccess();
        } catch (e) { toast.error('Gagal update'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold mb-2">Penanganan Pasien</h3>
                <p className="text-sm text-gray-500 mb-4">{visit.student?.user?.name} - Keluhan: {visit.complaint}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Diagnosis</label>
                        <input className="w-full px-4 py-2 border rounded-xl" value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Penanganan</label>
                        <textarea rows={2} className="w-full px-4 py-2 border rounded-xl" value={formData.treatment} onChange={e => setFormData({ ...formData, treatment: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Obat yang Diberikan</label>
                        <input className="w-full px-4 py-2 border rounded-xl" value={formData.medication_given} onChange={e => setFormData({ ...formData, medication_given: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1">Status Akhir</label>
                        <select className="w-full px-4 py-2 border rounded-xl" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="treated">Ditangani (Kembali ke Kelas)</option>
                            <option value="sent_home">Dipulangkan</option>
                            <option value="referred">Dirujuk ke RS/Klinik</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddMedicineModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', type: '', stock: 10, expiry_date: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/uks/medicines', formData);
            toast.success('Obat ditambahkan');
            onSuccess();
        } catch (e) { toast.error('Gagal tambah'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Tambah Obat</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Nama Obat" className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Jenis (Tablet/Sirup)" className="w-full px-4 py-2 border rounded-xl" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                        <input type="number" required placeholder="Stok" className="w-full px-4 py-2 border rounded-xl" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">Tanggal Kadaluarsa</label>
                        <input type="date" className="w-full px-4 py-2 border rounded-xl" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
