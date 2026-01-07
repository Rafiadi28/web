'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatCurrency } from '@/lib/utils';
import {
    CreditCard,
    DollarSign,
    Plus,
    Search,
    FileText,
    History,
    CheckCircle,
    XCircle,
    Download,
    Filter,
    Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export default function FinancePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('invoices'); // invoices, payments, types

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Keuangan & Pembayaran
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kelola tagihan SPP, pembayaran, dan laporan keuangan
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        activeTab === 'invoices'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    Tagihan (Invoices)
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        activeTab === 'payments'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    Riwayat Pembayaran
                </button>
                {['admin', 'super_admin', 'bendahara'].includes(user?.role || '') && (
                    <button
                        onClick={() => setActiveTab('types')}
                        className={cn(
                            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                            activeTab === 'types'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        Jenis Pembayaran
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'invoices' && <InvoicesTab role={user?.role} />}
            {activeTab === 'payments' && <PaymentsTab role={user?.role} />}
            {activeTab === 'types' && <PaymentTypesTab />}
        </div>
    );
}

// ============================================================================
// INVOICES TAB
// ============================================================================
function InvoicesTab({ role }: { role?: string }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal States
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/finance/invoices', { params });
            setInvoices(response.data.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = ['admin', 'super_admin', 'bendahara'].includes(role || '');

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                    <div className="flex items-center px-3 gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari tagihan/siswa..."
                            className="bg-transparent outline-none text-sm w-40"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                        <option value="">Semua Status</option>
                        <option value="unpaid">Belum Lunas</option>
                        <option value="paid">Lunas</option>
                        <option value="partial">Cicilan</option>
                    </select>

                    {isAdmin && (
                        <button
                            onClick={() => setShowGenerateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Buat Tagihan (Bulk)
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">No. Tagihan</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Siswa</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Jenis</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-right">Total</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium">{inv.invoice_number}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900 dark:text-white">{inv.student.user.name}</p>
                                        <p className="text-xs text-gray-500">{inv.student.class?.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Wallet className="w-4 h-4" /></span>
                                            <span>{inv.payment_type.name}</span>
                                        </div>
                                        {inv.month && <span className="text-xs text-gray-500 ml-8">{inv.month}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(inv.due_date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {formatCurrency(inv.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                inv.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                        )}>
                                            {inv.status === 'paid' ? 'Lunas' : inv.status === 'unpaid' ? 'Belum Bayar' : 'Cicilan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.status !== 'paid' && isAdmin && (
                                            <button
                                                onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                                            >
                                                Bayar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Tidak ada tagihan ditemukan</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showGenerateModal && (
                <GenerateInvoicesModal onClose={() => setShowGenerateModal(false)} onSuccess={() => { fetchInvoices(); setShowGenerateModal(false); }} />
            )}

            {showPayModal && selectedInvoice && (
                <PayInvoiceModal invoice={selectedInvoice} onClose={() => { setShowPayModal(false); setSelectedInvoice(null); }} onSuccess={() => { fetchInvoices(); setShowPayModal(false); }} />
            )}
        </div>
    );
}

// ============================================================================
// PAYMENTS TAB
// ============================================================================
function PaymentsTab({ role }: { role?: string }) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/payments');
            setPayments(response.data.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">No. Kuitansi</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Tagihan</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Siswa</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Tanggal Bayar</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Metode</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-right">Jumlah</th>
                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Penerima</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {payments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium">{pay.receipt_number}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {pay.invoice.invoice_number}
                                    <div className="text-xs">{pay.invoice.payment_type.name}</div>
                                </td>
                                <td className="px-6 py-4">{pay.invoice.student.user.name}</td>
                                <td className="px-6 py-4">{new Date(pay.paid_at).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-500">{pay.method}</td>
                                <td className="px-6 py-4 text-right font-medium text-green-600">
                                    {formatCurrency(pay.amount)}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {pay.receiver?.name}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payments.length === 0 && !loading && (
                    <div className="px-6 py-10 text-center text-gray-500">Belum ada riwayat pembayaran</div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PAYMENT TYPES TAB
// ============================================================================
import { Pencil, Trash2 } from 'lucide-react';

function PaymentTypesTab() {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', amount: '0', frequency: 'monthly', description: '' });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/payment-types');
            setTypes(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditMode(false);
        setFormData({ name: '', amount: '0', frequency: 'monthly', description: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (type: any) => {
        setEditMode(true);
        setSelectedId(type.id);
        setFormData({
            name: type.name,
            amount: type.amount,
            frequency: type.frequency,
            description: type.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jenis pembayaran ini?')) return;
        try {
            await api.delete(`/finance/payment-types/${id}`);
            toast.success('Berhasil dihapus');
            fetchTypes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menghapus');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedId) {
                await api.put(`/finance/payment-types/${selectedId}`, formData);
                toast.success('Berhasil diperbarui');
            } else {
                await api.post('/finance/payment-types', formData);
                toast.success('Berhasil ditambahkan');
            }
            fetchTypes();
            setShowModal(false);
        } catch (error) {
            toast.error('Gagal menyimpan');
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Jenis Pembayaran
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((type) => (
                    <div key={type.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-semibold uppercase">
                                    {type.frequency}
                                </span>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{type.name}</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {formatCurrency(type.amount)}
                        </p>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{type.description || 'Tidak ada deskripsi'}</p>

                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => handleOpenEdit(type)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-medium text-sm flex items-center justify-center gap-2">
                                <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDelete(type.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 font-medium text-sm flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{editMode ? 'Edit' : 'Tambah'} Jenis Pembayaran</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama</label>
                                <input required className="w-full px-4 py-2 rounded-xl border" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nominal</label>
                                <input required type="number" className="w-full px-4 py-2 rounded-xl border" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Frekuensi</label>
                                <select className="w-full px-4 py-2 rounded-xl border" value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                                    <option value="monthly">Bulanan</option>
                                    <option value="once">Sekali Bayar</option>
                                    <option value="yearly">Tahunan</option>
                                    <option value="semester">Per Semester</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                                <textarea className="w-full px-4 py-2 rounded-xl border" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MODALS
// ============================================================================

function GenerateInvoicesModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [types, setTypes] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        payment_type_id: '',
        class_id: '',
        month: '',
        due_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/finance/payment-types').then(res => setTypes(res.data.data));
        api.get('/lookup/classes').then(res => setClasses(res.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/finance/invoices/generate', {
                ...formData,
                class_id: formData.class_id || null // null means all
            });
            toast.success(res.data.message);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal generate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Buat Tagihan Massal</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Jenis Pembayaran</label>
                        <select required className="w-full px-4 py-2 rounded-xl border" value={formData.payment_type_id} onChange={e => setFormData({ ...formData, payment_type_id: e.target.value })}>
                            <option value="">Pilih Jenis</option>
                            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({formatCurrency(t.amount)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kelas (Opsional - Jika kosong semua siswa)</label>
                        <select className="w-full px-4 py-2 rounded-xl border" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                            <option value="">Semua Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Untuk Bulan (Khusus SPP)</label>
                        <input className="w-full px-4 py-2 rounded-xl border" placeholder="Contoh: Januari 2026" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Jatuh Tempo</label>
                        <input required type="date" className="w-full px-4 py-2 rounded-xl border" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50">
                            {loading ? 'Memproses...' : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PayInvoiceModal({ invoice, onClose, onSuccess }: { invoice: any, onClose: () => void, onSuccess: () => void }) {
    const [amount, setAmount] = useState(invoice.total_amount); // Default full amount
    const [method, setMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/finance/payments', {
                invoice_id: invoice.id,
                amount: amount,
                method: method
            });
            toast.success('Pembayaran berhasil');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal bayar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold mb-2">Input Pembayaran</h3>
                <p className="text-sm text-gray-500 mb-4">{invoice.invoice_number} - {invoice.student.user.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nominal Bayar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input
                                required
                                type="number"
                                className="w-full pl-10 pr-4 py-2 rounded-xl border"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                        <select className="w-full px-4 py-2 rounded-xl border" value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="cash">Tunai</option>
                            <option value="transfer">Transfer Bank</option>
                            <option value="qris">QRIS</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50">
                            {loading ? 'Memproses...' : 'Bayar Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
