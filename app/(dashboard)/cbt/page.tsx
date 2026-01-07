'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';
import { cn, formatDateTime } from '@/lib/utils';
import {
    Monitor,
    Play,
    Plus,
    Clock,
    FileText,
    Users,
    CheckCircle,
    Calendar,
    Brain,
    HelpCircle,
    Trash2,
    ArrowRight,
    ChevronLeft,
    Save
} from 'lucide-react';
import { toast } from 'sonner';

export default function CbtPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('exams'); // exams, banks

    const isTeacher = ['admin', 'super_admin', 'guru'].includes(user?.role || '');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Computer Based Test (CBT)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isTeacher ? 'Kelola ujian dan bank soal' : 'Daftar ujian yang tersedia'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            {isTeacher && (
                <div className="flex overflow-x-auto gap-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={cn(
                            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                            activeTab === 'exams'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        <Monitor className="w-4 h-4" />
                        Jadwal Ujian
                    </button>
                    <button
                        onClick={() => setActiveTab('banks')}
                        className={cn(
                            'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2',
                            activeTab === 'banks'
                                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        <Brain className="w-4 h-4" />
                        Bank Soal
                    </button>
                </div>
            )}

            {activeTab === 'exams' && <ExamsList role={user?.role} />}
            {activeTab === 'banks' && isTeacher && <QuestionBanksList />}
        </div>
    );
}

import { useRouter } from 'next/navigation';

// ... (other imports)

// ==========================================
// EXAMS LIST
// ==========================================
function ExamsList({ role }: { role?: string }) {
    const router = useRouter(); // Initialize router
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/cbt/exams');
            setExams(response.data.data.data || response.data.data); // Handle pagination or list
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isTeacher = ['admin', 'super_admin', 'guru'].includes(role || '');

    return (
        <div className="space-y-4">
            {isTeacher && (
                <div className="flex justify-end">
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Buat Jadwal Ujian
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                    <div key={exam.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                            <Monitor className="w-24 h-24" />
                        </div>

                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <span className={cn(
                                "px-2 py-1 rounded-lg text-xs font-semibold uppercase",
                                exam.type === 'uh' ? 'bg-blue-100 text-blue-700' :
                                    exam.type === 'pts' ? 'bg-yellow-100 text-yellow-700' :
                                        exam.type === 'pas' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            )}>
                                {exam.type}
                            </span>
                            {isTeacher && (
                                <span className={cn("text-xs flex items-center gap-1", exam.is_active ? 'text-green-600' : 'text-red-500')}>
                                    <div className={cn("w-2 h-2 rounded-full", exam.is_active ? 'bg-green-500' : 'bg-red-500')}></div>
                                    {exam.is_active ? 'Aktif' : 'Non-Aktif'}
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 relative z-10">{exam.title}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 relative z-10">{exam.description || 'Tidak ada deskripsi'}</p>

                        <div className="space-y-2 mb-6 relative z-10">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FileText className="w-4 h-4" />
                                {exam.class_subject?.subject?.name || 'Mapel Umum'} - {exam.class_subject?.class?.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(exam.start_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                {exam.duration} Menit
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <HelpCircle className="w-4 h-4" />
                                {exam.total_questions} Soal
                            </div>
                        </div>

                        {!isTeacher ? (
                            <button
                                onClick={async () => {
                                    if (confirm('Mulai ujian ini sekarang? Waktu akan berjalan.')) {
                                        try {
                                            const res = await api.post(`/cbt/exams/${exam.id}/start`);
                                            const sessionId = res.data.data.id;
                                            router.push(`/cbt/exam/${sessionId}`);
                                        } catch (e: any) {
                                            toast.error(e.response?.data?.error || 'Gagal memulai ujian');
                                        }
                                    }
                                }}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 relative z-10"
                            >
                                <Play className="w-4 h-4" /> Mulai Kerjakan
                            </button>
                        ) : (
                            <button className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 text-sm relative z-10">
                                Detail & Hasil
                            </button>
                        )}
                    </div>
                ))}
                {exams.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500">Belum ada jadwal ujian</div>
                )}
            </div>

            {showModal && <CreateExamModal onClose={() => setShowModal(false)} onSuccess={() => { fetchExams(); setShowModal(false); }} />}
        </div>
    );
}
// ==========================================
// QUESTION BANKS LIST COMPONENTS (FIXED)
// ==========================================
function QuestionEditor({ bankId, onBack }: { bankId: number, onBack: () => void }) {
    const [bank, setBank] = useState<any>(null);
    const [formData, setFormData] = useState({
        type: 'pilihan_ganda',
        question: '',
        points: 1,
        // Optional
        option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
        correct_answer: '' // key like 'A', 'B' etc
    });

    useEffect(() => {
        fetchBank();
    }, [bankId]);

    const fetchBank = async () => {
        try {
            const res = await api.get(`/cbt/banks/${bankId}`);
            setBank(res.data.data);
        } catch (e) { console.error(e); }
    };

    const handleDeleteQuestion = async (id: number) => {
        if (!confirm('Hapus soal ini?')) return;
        try {
            await api.delete(`/cbt/questions/${id}`);
            fetchBank();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Build options json if multiple choice
            let options = null;
            let finalCorrect = formData.correct_answer;

            if (formData.type === 'pilihan_ganda') {
                options = {
                    A: formData.option_a,
                    B: formData.option_b,
                    C: formData.option_c,
                    D: formData.option_d,
                    E: formData.option_e,
                };
            }

            await api.post('/cbt/questions', {
                question_bank_id: bankId,
                type: formData.type,
                question: formData.question,
                points: formData.points,
                options: options,
                correct_answer: finalCorrect
            });

            toast.success('Soal ditambahkan');
            setFormData({
                type: 'pilihan_ganda', question: '', points: 1,
                option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
                correct_answer: ''
            });
            fetchBank();
        } catch (e) { toast.error('Gagal tambah soal'); }
    };

    if (!bank) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" /> Kembali
            </button>

            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{bank.name}</h2>
                    <p className="text-sm text-gray-500">{bank.subject?.name} - {bank.questions?.length || 0} Soal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Input Soal */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
                    <h3 className="font-bold mb-4">Input Soal Baru</h3>
                    <form onSubmit={handleAddQuestion} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Tipe Soal</label>
                            <select className="w-full px-4 py-2 border rounded-xl" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="pilihan_ganda">Pilihan Ganda</option>
                                <option value="uraian">Uraian / Essay</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Pertanyaan</label>
                            <textarea required rows={3} className="w-full px-4 py-2 border rounded-xl" value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} placeholder="Tulis pertanyaan..." />
                        </div>

                        {formData.type === 'pilihan_ganda' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium mb-1 block">Pilihan Jawaban</label>
                                {['a', 'b', 'c', 'd', 'e'].map(opt => (
                                    <div key={opt} className="flex gap-2 items-center">
                                        <span className="w-6 text-center uppercase font-bold text-gray-400">{opt}</span>
                                        <input className="w-full px-3 py-1.5 border rounded-lg text-sm"
                                            placeholder={`Opsi ${opt.toUpperCase()}`}
                                            // @ts-ignore
                                            value={formData[`option_${opt}`]}
                                            // @ts-ignore
                                            onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                                        />
                                        <input type="radio" name="correct" checked={formData.correct_answer === opt.toUpperCase()} onChange={() => setFormData({ ...formData, correct_answer: opt.toUpperCase() })} />
                                    </div>
                                ))}
                                <p className="text-xs text-gray-400 text-right">*Pilih radio button untuk kunci jawaban</p>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium mb-1 block">Bobot Poin</label>
                            <input type="number" className="w-20 px-4 py-2 border rounded-xl" value={formData.points} onChange={e => setFormData({ ...formData, points: Number(e.target.value) })} />
                        </div>

                        <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">Simpan Soal</button>
                    </form>
                </div>

                {/* List Soal */}
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                    {bank.questions?.map((q: any, idx: number) => (
                        <div key={q.id} className="bg-white p-4 rounded-2xl border hover:shadow-md transition-shadow relative group">
                            <span className="absolute top-4 right-4 text-xs font-bold text-gray-400">#{idx + 1} ({q.points} Poin)</span>
                            <div className="pr-12">
                                <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                                {q.type === 'pilihan_ganda' && (
                                    <div className="space-y-1 ml-2">
                                        {Object.entries(q.options || {}).map(([key, val]) => (
                                            <div key={key} className={cn("text-xs flex gap-2", key === q.correct_answer ? "text-green-600 font-bold" : "text-gray-500")}>
                                                <span>{key}.</span>
                                                <span>{String(val)}</span>
                                                {key === q.correct_answer && <CheckCircle className="w-3 h-3" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 text-xs flex items-center gap-1 hover:underline"><Trash2 className="w-3 h-3" /> Hapus</button>
                            </div>
                        </div>
                    ))}
                    {(!bank.questions || bank.questions.length === 0) && (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-2xl">Belum ada soal</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// QUESTION BANKS LIST
// ==========================================
// ==========================================
// QUESTION BANKS LIST
// ==========================================
function QuestionBanksList() {
    const [banks, setBanks] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // For Question Editor
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

    useEffect(() => {
        fetchBanks();
        api.get('/lookup/subjects').then(res => setSubjects(res.data.data)); // Need simple lookup
    }, []);

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const response = await api.get('/cbt/banks');
            setBanks(response.data.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus bank soal ini? Semua soal di dalamnya akan terhapus.')) return;
        try {
            await api.delete(`/cbt/banks/${id}`);
            toast.success('Bank soal dihapus');
            fetchBanks();
        } catch (e) { toast.error('Gagal hapus'); }
    };

    if (selectedBankId) {
        return <QuestionEditor bankId={selectedBankId} onBack={() => setSelectedBankId(null)} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl flex items-center gap-2 hover:bg-purple-700">
                    <Plus className="w-4 h-4" /> Buat Bank Soal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks.map((bank) => (
                    <div key={bank.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border shadow-sm group">
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 uppercase">
                                {bank.grade}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => handleDelete(bank.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{bank.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{bank.subject?.name || 'Mapel Umum'}</p>

                        <div className="pt-4 border-t flex justify-between items-center">
                            <span className="text-xs text-gray-500">{bank.questions_count || 0} Soal</span>
                            <button onClick={() => setSelectedBankId(bank.id)} className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                Kelola Soal <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {banks.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500">Belum ada bank soal</div>
                )}
            </div>

            {showModal && <CreateBankModal subjects={subjects} onClose={() => setShowModal(false)} onSuccess={() => { fetchBanks(); setShowModal(false); }} />}
        </div>
    )
}

function CreateBankModal({ subjects, onClose, onSuccess }: { subjects: any[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({ name: '', subject_id: '', grade: 'X' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/cbt/banks', formData);
            toast.success('Bank soal dibuat');
            onSuccess();
        } catch (e) { toast.error('Gagal membuat'); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Buat Bank Soal Baru</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Nama Paket Soal" className="w-full px-4 py-2 border rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                        <option value="">Pilih Mata Pelajaran</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select required className="w-full px-4 py-2 border rounded-xl" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                        <option value="X">Kelas X</option>
                        <option value="XI">Kelas XI</option>
                        <option value="XII">Kelas XII</option>
                    </select>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// ==========================================
// CREATE EXAM MODAL
// ==========================================
function CreateExamModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        type: 'uh',
        description: '',
        class_id: '',
        subject_id: '',
        start_time: '',
        end_time: '',
        duration: 60,
        question_bank_id: ''
    });

    useEffect(() => {
        // Fetch dependencies
        api.get('/lookup/classes').then(res => setClasses(res.data.data));
        api.get('/lookup/subjects').then(res => setSubjects(res.data.data)); // Need simple lookup
        api.get('/cbt/banks').then(res => setBanks(res.data.data.data)); // Ideally filtered
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/cbt/exams', formData);
            toast.success('Jadwal ujian berhasil dibuat');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membuat ujian');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Buat Jadwal Ujian</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-medium mb-1 block">Judul Ujian</label>
                            <input required className="w-full px-4 py-2 border rounded-xl" placeholder="Contoh: Ulangan Harian Bab 1" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Tipe</label>
                            <select className="w-full px-4 py-2 border rounded-xl" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="uh">Ulangan Harian</option>
                                <option value="pts">PTS (Mid Semester)</option>
                                <option value="pas">PAS (Akhir Semester)</option>
                                <option value="pat">PAT (Akhir Tahun)</option>
                                <option value="tryout">Try Out</option>
                                <option value="latihan">Latihan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Durasi (Menit)</label>
                            <input type="number" required className="w-full px-4 py-2 border rounded-xl" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} />
                        </div>
                    </div>

                    {/* Target & Content */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Kelas Target</label>
                            <select required className="w-full px-4 py-2 border rounded-xl" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Pilih Kelas</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Mata Pelajaran</label>
                            <select required className="w-full px-4 py-2 border rounded-xl" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}>
                                <option value="">Pilih Mapel</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium mb-1 block">Ambil Soal Dari Bank Soal</label>
                            <select className="w-full px-4 py-2 border rounded-xl" value={formData.question_bank_id} onChange={e => setFormData({ ...formData, question_bank_id: e.target.value })}>
                                <option value="">Pilih Bank Soal (Opsional)</option>
                                {banks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.questions_count || 0} Soal)</option>)}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Jika dipilih, semua soal dari bank tsb akan dimasukkan ke ujian.</p>
                        </div>
                    </div>

                    {/* Timing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Waktu Mulai</label>
                            <input type="datetime-local" required className="w-full px-4 py-2 border rounded-xl" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Waktu Selesai</label>
                            <input type="datetime-local" required className="w-full px-4 py-2 border rounded-xl" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">Simpan Jadwal</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
