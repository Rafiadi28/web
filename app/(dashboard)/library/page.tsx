'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    BookOpen,
    Search,
    Plus,
    Clock,
    User,
    CheckCircle,
    XCircle,
    Library
} from 'lucide-react';
import { toast } from 'sonner';

export default function LibraryPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('books'); // books, borrowings

    // Check if user is staff (admin/pustakawan/guru)
    const isStaff = ['admin', 'super_admin', 'pustakawan', 'guru'].includes(user?.role || '');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Perpustakaan Digital
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isStaff ? 'Manajemen buku dan peminjaman' : 'Cari dan pinjam buku'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('books')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'books'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    <Library className="w-4 h-4" />
                    Katalog Buku
                </button>
                <button
                    onClick={() => setActiveTab('borrowings')}
                    className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                        activeTab === 'borrowings'
                            ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    )}
                >
                    <Clock className="w-4 h-4" />
                    {isStaff ? 'Data Peminjaman' : 'Peminjaman Saya'}
                </button>
            </div>

            {activeTab === 'books' && <BooksTab isStaff={isStaff} />}
            {activeTab === 'borrowings' && <BorrowingsTab isStaff={isStaff} />}
        </div>
    );
}

// ==========================================
// BOOKS TAB
// ==========================================
function BooksTab({ isStaff }: { isStaff: boolean }) {
    const [books, setBooks] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, [search]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/library/books', { params: { search } });
            setBooks(res.data.data.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari judul atau penulis..."
                        className="pl-10 pr-4 py-2 border rounded-xl w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {isStaff && (
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 shrink-0">
                        <Plus className="w-4 h-4" /> Tambah Buku
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {books.map((book) => (
                    <div key={book.id} className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                        <div className="aspect-[2/3] bg-gray-200 relative overflow-hidden">
                            {book.cover_image ? (
                                <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700">
                                    <BookOpen className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Stok: {book.stock}
                            </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1" title={book.title}>
                                {book.title}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">{book.author}</p>
                            <div className="mt-auto pt-2 border-t flex justify-between items-center">
                                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded">{book.category?.name}</span>
                                {isStaff && (
                                    <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {books.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500">Buku tidak ditemukan</div>
                )}
            </div>

            {showModal && <AddBookModal onClose={() => setShowModal(false)} onSuccess={() => { fetchBooks(); setShowModal(false); }} />}
        </div>
    );
}

// ==========================================
// BORROWINGS TAB
// ==========================================
function BorrowingsTab({ isStaff }: { isStaff: boolean }) {
    const [borrowings, setBorrowings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBorrowModal, setShowBorrowModal] = useState(false);

    useEffect(() => {
        fetchBorrowings();
    }, []);

    const fetchBorrowings = async () => {
        setLoading(true);
        try {
            const url = isStaff ? '/library/borrowings' : '/library/my-borrowings';
            const res = await api.get(url);
            setBorrowings(res.data.data.data || res.data.data); // Handle pagination or array
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleReturn = async (id: number) => {
        if (!confirm('Konfirmasi pengembalian buku?')) return;
        try {
            await api.post(`/library/return/${id}`);
            toast.success('Buku dikembalikan');
            fetchBorrowings();
        } catch (e) { toast.error('Gagal proses'); }
    };

    return (
        <div className="space-y-4">
            {isStaff && (
                <div className="flex justify-end">
                    <button onClick={() => setShowBorrowModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700">
                        <Plus className="w-4 h-4" /> Catat Peminjaman
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="px-6 py-4">Buku</th>
                            <th className="px-6 py-4">Peminjam</th>
                            <th className="px-6 py-4">Tanggal Pinjam</th>
                            <th className="px-6 py-4">Jatuh Tempo</th>
                            <th className="px-6 py-4">Status</th>
                            {isStaff && <th className="px-6 py-4 text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {borrowings.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium">{b.book?.title}</div>
                                    <div className="text-xs text-gray-500">{b.book?.isbn}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium">{b.user?.name}</div>
                                    <div className="text-xs text-gray-500">{b.user?.role}</div>
                                </td>
                                <td className="px-6 py-4">{formatDateTime(b.borrow_date)}</td>
                                <td className="px-6 py-4 text-red-600 font-medium">{formatDateTime(b.due_date)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-semibold capitalize",
                                        b.status === 'returned' ? 'bg-green-100 text-green-700' :
                                            b.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    )}>
                                        {b.status}
                                    </span>
                                </td>
                                {isStaff && (
                                    <td className="px-6 py-4 text-right">
                                        {b.status === 'borrowed' && (
                                            <button onClick={() => handleReturn(b.id)} className="text-blue-600 hover:underline text-xs">
                                                Kembalikan
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {borrowings.length === 0 && !loading && (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Tidak ada data peminjaman</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showBorrowModal && <BorrowBookModal onClose={() => setShowBorrowModal(false)} onSuccess={() => { fetchBorrowings(); setShowBorrowModal(false); }} />}
        </div>
    );
}

// ==========================================
// MODALS
// ==========================================
function AddBookModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '', author: '', publisher: '', year: new Date().getFullYear(),
        stock: 5, category_id: '', shelf_location: ''
    });

    useEffect(() => {
        api.get('/library/categories').then(res => setCategories(res.data.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/library/books', formData);
            toast.success('Buku ditambahkan');
            onSuccess();
        } catch (e) { toast.error('Gagal tambah buku'); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold mb-4">Tambah Buku Baru</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Judul Buku" className="w-full px-4 py-2 border rounded-xl" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Penulis" className="w-full px-4 py-2 border rounded-xl" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                        <input placeholder="Penerbit" className="w-full px-4 py-2 border rounded-xl" value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Tahun" className="w-full px-4 py-2 border rounded-xl" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} />
                        <input type="number" required placeholder="Stok" className="w-full px-4 py-2 border rounded-xl" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                    </div>
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input placeholder="Lokasi Rak" className="w-full px-4 py-2 border rounded-xl" value={formData.shelf_location} onChange={e => setFormData({ ...formData, shelf_location: e.target.value })} />

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function BorrowBookModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    // Placeholder - would need User Search and Book Search in real implementation
    // For now, let's just make a simple form that assumes we know IDs or use simple selects (not scalable but working for demo)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.info("Fitur pencarian User/Buku untuk peminjaman akan diimplementasikan selanjutnya (butuh component Searchable Select).");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Catat Peminjaman</h3>
                <p className="text-gray-500 mb-4">Form pencarian peminjam dan buku.</p>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
