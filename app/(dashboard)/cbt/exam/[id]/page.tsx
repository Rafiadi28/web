'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Save,
    Flag,
    Menu,
    X,
    Maximize,
    Minimize
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExamRunnerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const sessionId = params.id;

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.get(`/cbt/exams/session/${sessionId}`);
                if (res.data.success) {
                    const data = res.data.data;
                    setSession(data.session);
                    setQuestions(data.questions);

                    // Map saved answers
                    const ansMap: Record<number, any> = {};
                    data.answers.forEach((a: any) => {
                        ansMap[a.question_id] = a.answer;
                    });
                    setAnswers(ansMap);

                    // Calculate time left based on end_time or duration
                    // Simplify: use exam end_time relative to now
                    const now = new Date().getTime();
                    const end = new Date(data.session.exam.end_time).getTime();
                    const diff = Math.floor((end - now) / 1000);
                    setTimeLeft(diff > 0 ? diff : 0);

                    if (data.session.status !== 'in_progress') {
                        toast.error('Ujian ini sudah selesai');
                        router.push('/cbt');
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Gagal memuat sesi ujian');
                router.push('/cbt');
            } finally {
                setLoading(false);
            }
        };
        init();

        // Anti-cheat listeners (placeholder)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.warning('PERINGATAN: Jangan meninggalkan halaman ujian!');
                // Send log to backend
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [sessionId]);

    // Timer
    useEffect(() => {
        if (!loading && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        finishExam(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [loading, timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = async (val: any) => {
        const qId = questions[currentQIndex].id;

        // Optimistic update
        setAnswers(prev => ({ ...prev, [qId]: val }));

        // Send to backend (debounce this in real app)
        try {
            await api.post(`/cbt/exams/session/${sessionId}/answer`, {
                question_id: qId,
                answer: val
            });
        } catch (e) { console.error('Gagal simpan jawaban'); }
    };

    const finishExam = async (auto = false) => {
        if (!auto && !confirm('Apakah Anda yakin ingin menyelesaikan ujian? Anda tidak dapat mengubah jawaban setelah ini.')) return;

        try {
            await api.post(`/cbt/exams/session/${sessionId}/finish`);
            toast.success('Ujian selesai!');
            router.push('/cbt');
        } catch (e) { toast.error('Gagal menyelesaikan ujian'); }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat Ujian...</div>;

    const currentQ = questions[currentQIndex];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{session.exam.title}</h1>
                        <span className="text-xs text-gray-500">{session.student?.name}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold border",
                        timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                    )}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block">
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-4 flex gap-6 h-[calc(100vh-80px)] overflow-hidden">
                {/* Question Area */}
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    {/* Q Header */}
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <h2 className="font-bold text-lg">Soal No. {currentQIndex + 1}</h2>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                            Bobot: {currentQ.points}
                        </span>
                    </div>

                    {/* Q Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="prose dark:prose-invert max-w-none mb-8 text-lg">
                            {currentQ.question}
                        </div>

                        {/* Options */}
                        {currentQ.type === 'pilihan_ganda' ? (
                            <div className="space-y-3">
                                {Object.entries(currentQ.options || {}).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleAnswer(key)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 hover:border-blue-300",
                                            answers[currentQ.id] === key
                                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                            answers[currentQ.id] === key
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        )}>
                                            {key}
                                        </span>
                                        <span className="mt-1 text-gray-800 dark:text-gray-200">{String(val)}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                rows={8}
                                className="w-full p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Tulis jawaban Anda di sini..."
                                value={answers[currentQ.id] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <button
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => prev - 1)}
                            className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>

                        <div className="hidden sm:flex gap-2">
                            <label className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm cursor-pointer hover:bg-yellow-200">
                                <input type="checkbox" className="rounded text-yellow-600 focus:ring-yellow-500" />
                                Ragu-Ragu
                            </label>
                        </div>

                        <button
                            onClick={() => {
                                if (currentQIndex < questions.length - 1) {
                                    setCurrentQIndex(prev => prev + 1);
                                } else {
                                    finishExam();
                                }
                            }}
                            className={cn(
                                "px-6 py-2 rounded-xl text-white font-medium flex items-center gap-2 shadow-sm transition-all",
                                currentQIndex === questions.length - 1 ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {currentQIndex === questions.length - 1 ? (
                                <>Selesai <CheckCircle className="w-4 h-4" /></>
                            ) : (
                                <>Selanjutnya <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <aside className={cn(
                    "fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 lg:relative lg:transform-none lg:shadow-none lg:w-72 lg:bg-transparent flex flex-col",
                    isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                )}>
                    <div className="p-4 border-b flex justify-between items-center lg:hidden">
                        <h3 className="font-bold">Navigasi Soal</h3>
                        <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800 rounded-2xl lg:shadow-sm">
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setCurrentQIndex(idx);
                                            setIsSidebarOpen(false);
                                        }}
                                        className={cn(
                                            "w-full aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2",
                                            currentQIndex === idx
                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                : isAnswered
                                                    ? "bg-green-500 text-white border-green-600"
                                                    : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200"
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-3 h-3 bg-green-500 rounded"></div> Sudah Dijawab
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-3 h-3 bg-blue-50 border-2 border-blue-600 rounded"></div> Sedang Dikerjakan
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-3 h-3 bg-gray-100 rounded"></div> Belum Dijawab
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <button onClick={() => finishExam()} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none">
                            Hentikan Ujian
                        </button>
                    </div>
                </aside>
            </main>
        </div>
    );
}
