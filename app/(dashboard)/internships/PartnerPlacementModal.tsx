'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    closestCenter
} from '@dnd-kit/core';
import { User, Building2, GripVertical, CheckCircle, Search, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Student {
    id: number;
    name?: string;
    user?: { name: string };
    class?: { name: string };
    department?: { name: string };
}

interface Partner {
    id: number;
    name: string;
}

export default function PartnerPlacementModal({
    partner,
    periodId,
    onClose
}: {
    partner: any,
    periodId: number, // We need to know which period we are working on!
    onClose: () => void
}) {
    const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
    const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [assignedSupervisorId, setAssignedSupervisorId] = useState<string>('');
    const [activeId, setActiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('');

    // If periodId is not passed, we might need to fetch active period
    // But for now let's assume parent passes it or we pick active.

    useEffect(() => {
        fetchData();
    }, [partner.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Active Period if not provided?
            // Actually, we need a period context. 
            // Let's assume we fetch the active period if periodId is missing, OR generic fetch.
            // Note: API /internships depends on period filtering mostly.

            // Allow selecting period inside modal if not passed?
            // For simplicity, let's fetch 'current active period' if periodId is 0 or null?
            // Or just use the one passed.

            const pId = periodId || (await api.get('/internships/periods').then(r => r.data.data.find((p: any) => p.is_active)?.id));
            if (!pId) {
                toast.error('Tidak ada periode aktif');
                setLoading(false);
                return;
            }

            // 2. Get Teachers
            const resTeachers = await api.get('/lookup/teachers');
            setTeachers(resTeachers.data.data);

            // 3. Get All Internships (to find assigned/unassigned)
            // Use 'all=1' to avoid pagination issues
            const resInternships = await api.get('/internships?all=1');
            const allInternships = resInternships.data.data.data || resInternships.data.data;

            // Filter assignments for THIS partner and THIS period
            const myAssignments = allInternships.filter((i: any) => i.partner_id === partner.id && i.period_id == pId);
            setAssignedStudents(myAssignments);

            // Set default supervisor from existing data if available
            if (myAssignments.length > 0 && myAssignments[0].supervisor_id) {
                setAssignedSupervisorId(String(myAssignments[0].supervisor_id));
            }

            // 4. Get Unassigned Students (All active students - can filter by class in UI)
            const resStudents = await api.get('/lookup/students');
            const allStudents = resStudents.data.data;

            // Determine who is already assigned (in THIS period)
            // Note: A student can be assigned to different periods, but in ONE period, only one assignment.
            const assignedInPeriod = new Set(
                allInternships
                    .filter((i: any) => i.period_id == pId)
                    .map((i: any) => i.student_id)
            );

            const unassigned = allStudents.filter((s: any) => !assignedInPeriod.has(s.id));
            setUnassignedStudents(unassigned);

        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id && over.id === 'drop-zone') {
            const studentId = active.id as number;

            // Determine Period
            // Ideally we saved it in state
            const periodsRes = await api.get('/internships/periods');
            const pId = periodId || periodsRes.data.data.find((p: any) => p.is_active)?.id;

            // Optimistic Update
            const student = unassignedStudents.find(s => s.id === studentId);
            if (!student) return;

            setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
            setAssignedStudents(prev => [...prev, { student, supervisor_id: assignedSupervisorId }]); // Mock structure

            try {
                await api.post('/internships', {
                    student_id: studentId,
                    partner_id: partner.id,
                    period_id: pId,
                    supervisor_id: assignedSupervisorId || null
                });
                toast.success('Siswa ditambahkan');
            } catch (e) {
                toast.error('Gagal assign');
                fetchData();
            }
        }
    };

    // Unassign (Delete internship)
    const handleUnassign = async (internshipId: number) => {
        if (!confirm('Hapus siswa dari tempat PKL ini?')) return;
        try {
            await api.delete(`/internships/${internshipId}`);
            toast.success('Siswa dihapus dari penempatan');
            fetchData(); // Refresh data
        } catch (e) {
            console.error(e);
            toast.error('Gagal menghapus penempatan');
        }
    };

    const filteredStudents = unassignedStudents.filter(s =>
        (s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedClass ? s.class?.name === selectedClass : true)
    );
    const classes = Array.from(new Set(unassignedStudents.map(s => s.class?.name).filter(Boolean)));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-green-600" />
                            Kelola Siswa: {partner.name}
                        </h2>
                        <p className="text-sm text-gray-500">Drag siswa dari kiri ke area kanan.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>

                        {/* LEFT: Unassigned Students */}
                        <div className="w-full md:w-1/3 border-r flex flex-col bg-gray-50/50">
                            <div className="p-4 border-b space-y-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        placeholder="Cari Siswa..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select className="w-full px-3 py-2 text-sm border rounded-lg" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                    <option value="">Semua Kelas</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {loading ? <div className="text-center p-4">Loading...</div> : (
                                    <>
                                        {filteredStudents.map(s => <DraggableStudent key={s.id} student={s} />)}
                                        {filteredStudents.length === 0 && <div className="text-center text-gray-400 text-sm py-4">Tidak ada siswa</div>}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Partner Drop Zone */}
                        <div className="flex-1 flex flex-col bg-white">
                            {/* Supervisor Selector */}
                            <div className="p-4 border-b flex items-center gap-4 bg-blue-50/30">
                                <label className="text-sm font-medium whitespace-nowrap">Guru Pembimbing:</label>
                                <select
                                    className="flex-1 max-w-sm px-3 py-2 border rounded-lg text-sm bg-white"
                                    value={assignedSupervisorId}
                                    onChange={e => setAssignedSupervisorId(e.target.value)}
                                >
                                    <option value="">-- Pilih Pembimbing --</option>
                                    {teachers.map(t => <option key={t.id} value={t.user_id}>{t.user?.name || t.nip}</option>)}
                                </select>
                            </div>

                            {/* DROP ZONE */}
                            <DropZone assignedStudents={assignedStudents}>
                                {assignedStudents.length === 0 && (
                                    <div className="text-center text-gray-400 italic py-10 border-2 border-dashed rounded-xl m-4">
                                        Drag siswa ke sini untuk ditambahkan
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                                    {assignedStudents.map((item, idx) => (
                                        <div key={item.id || idx} className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md flex items-center gap-3 group relative">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                                {item.student?.user?.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{item.student?.user?.name || item.student?.name}</p>
                                                <p className="text-xs text-gray-500">{item.student?.class?.name}</p>
                                            </div>
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleUnassign(item.id)}
                                                className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Hapus dari penempatan"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </DropZone>
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <div className="bg-blue-600 text-white p-3 rounded-lg shadow-xl w-64 flex items-center gap-3 opacity-90 cursor-grabbing">
                                    <GripVertical className="w-5 h-5 opacity-50" />
                                    <span className="font-medium">Adding Student...</span>
                                </div>
                            ) : null}
                        </DragOverlay>

                    </DndContext>
                </div>
            </div>
        </div>
    );
}

function DraggableStudent({ student }: { student: Student }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: student.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            className={cn(
                "bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3 cursor-grab hover:border-blue-500 hover:shadow-md touch-none",
                isDragging && "opacity-0"
            )}
        >
            <GripVertical className="w-4 h-4 text-gray-400" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{student.user?.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-1.5 rounded">{student.class?.name}</span>
                </div>
            </div>
        </div>
    );
}

function DropZone({ children, assignedStudents }: { children: React.ReactNode, assignedStudents: any[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: 'drop-zone' });
    return (
        <div ref={setNodeRef} className={cn("flex-1 overflow-y-auto transition-colors", isOver ? "bg-blue-50" : "bg-white")}>
            {children}
        </div>
    );
}
