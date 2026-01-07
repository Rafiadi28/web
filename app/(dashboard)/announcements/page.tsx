'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Megaphone,
    Plus,
    Search,
    Calendar,
    User,
    Clock,
    Pin,
    MoreVertical,
    Trash2,
    Edit,
    X,
    Send
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';

export default function AnnouncementsPage() {
    const { user } = useAuthStore();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        is_pinned: false
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/announcements', { params: { search } });
            setAnnouncements(res.data.data.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus pengumuman ini?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/announcements', formData);
            setShowModal(false);
            setFormData({ title: '', content: '', priority: 'normal', is_pinned: false });
            fetchAnnouncements();
        } catch (error) {
            console.error(error);
            alert('Gagal membuat pengumuman');
        } finally {
            setSubmitting(false);
        }
    };

    const priorityColors = {
        low: 'bg-gray-100 text-gray-700',
        normal: 'bg-blue-100 text-blue-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700'
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'low': return 'Info';
            case 'high': return 'Penting';
            case 'urgent': return 'Darurat';
            default: return 'Umum';
        }
    };

    const canCreate = ['admin', 'super_admin', 'kepala_sekolah', 'humas'].includes(user?.role || '');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pengumuman
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Informasi dan berita terbaru sekolah
                    </p>
                </div>

                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Buat Pengumuman
                    </button>
                )}
            </div>

            <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari pengumuman..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchAnnouncements()}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {announcements.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center text-gray-500">
                            <Megaphone className="w-16 h-16 mb-4 opacity-20" />
                            <p>Tidak ada pengumuman saat ini.</p>
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <div key={item.id} className={cn(
                                "group bg-white dark:bg-gray-800 rounded-xl border p-5 flex flex-col h-full hover:shadow-lg transition-all",
                                item.is_pinned
                                    ? "border-blue-200 dark:border-blue-900 shadow-blue-100 dark:shadow-none"
                                    : "border-gray-200 dark:border-gray-700"
                            )}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", priorityColors[item.priority as keyof typeof priorityColors])}>
                                            {getPriorityLabel(item.priority)}
                                        </span>
                                        {item.is_pinned && (
                                            <Pin className="w-3 h-3 text-blue-500 fill-blue-500 transform rotate-45" />
                                        )}
                                    </div>
                                    {(canCreate || user?.id === item.created_by) && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                    {item.title}
                                </h3>

                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-1 whitespace-pre-line">
                                    {item.content}
                                </p>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3 h-3" />
                                        <span className="truncate max-w-[100px]">{item.creator?.name || 'Admin'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(item.published_at || item.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold">Buat Pengumuman Baru</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Isi Pengumuman</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prioritas</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Info (Low)</option>
                                        <option value="normal">Umum (Normal)</option>
                                        <option value="high">Penting (High)</option>
                                        <option value="urgent">Darurat (Urgent)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="pinned"
                                    checked={formData.is_pinned}
                                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600"
                                />
                                <label htmlFor="pinned" className="text-sm">Pin Pengumuman (Tampil Teratas)</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Batal</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : (
                                        <>
                                            <Send className="w-4 h-4" /> Terbitkan
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
