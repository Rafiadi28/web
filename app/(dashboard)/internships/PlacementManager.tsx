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
import { CSS } from '@dnd-kit/utilities';
import { User, Building2, GripVertical, CheckCircle, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Student {
    id: number;
    name?: string;
    className?: string; // from eager load
    user?: { name: string };
    class?: { name: string };
    department?: { name: string };
}

interface Partner {
    id: number;
    name: string;
    city: string;
    quota?: number; // capacity
    internships_count?: number; // current filled
    internships?: any[];
}

export default function PlacementManager({ periodId }: { periodId: number }) {
    const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [teachers, setTeachers] = useState<any[]>([]);
    const [partnerSupervisors, setPartnerSupervisors] = useState<Record<number, string>>({}); // Map PartnerID -> SupervisorID
    const [searchQuery, setSearchQuery] = useState('');

    // Filtering
    const [selectedClass, setSelectedClass] = useState<string>('');

    useEffect(() => {
        if (periodId) fetchData();
        api.get('/lookup/teachers').then(res => setTeachers(res.data.data));
    }, [periodId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Unassigned Students
            const resStudents = await api.get('/lookup/students?grade=12');
            const allStudents = resStudents.data.data;

            // Fetch existing internships
            const resInternships = await api.get('/internships?all=1');
            const existingAssignments = resInternships.data.data.data || resInternships.data.data;
            const assignedStudentIds = new Set(existingAssignments.map((i: any) => i.student_id));

            const unassigned = allStudents.filter((s: any) => !assignedStudentIds.has(s.id));
            setUnassignedStudents(unassigned);

            // 2. Partners data
            const resPartners = await api.get('/internships/partners');
            const partnersData = resPartners.data.data;

            const partnersWithCount = partnersData.map((p: any) => ({
                ...p,
                internships_count: existingAssignments.filter((i: any) => i.partner_id === p.id && i.period_id == periodId).length,
                internships: existingAssignments.filter((i: any) => i.partner_id === p.id && i.period_id == periodId)
            }));
            setPartners(partnersWithCount);

            // 3. Pre-fill Supervisors based on existing assignments
            // If a partner has students already assigned, assume the supervisor of the first student is the supervisor for the group
            const initialSupervisors: Record<number, string> = {};
            partnersWithCount.forEach((p: any) => {
                if (p.internships && p.internships.length > 0) {
                    const firstSupervisor = p.internships[0].supervisor_id;
                    if (firstSupervisor) {
                        initialSupervisors[p.id] = String(firstSupervisor);
                    }
                }
            });
            setPartnerSupervisors(initialSupervisors);

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

        if (over && active.id && over.id) {
            const studentId = active.id as number;
            const partnerId = over.id as number;

            // Get selected supervisor for this partner
            const supervisorId = partnerSupervisors[partnerId];

            // Optimistic Update
            const student = unassignedStudents.find(s => s.id === studentId);
            if (!student) return;

            // Move UI immediately
            setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
            setPartners(prev => prev.map(p => {
                if (p.id === partnerId) {
                    return {
                        ...p,
                        internships_count: (p.internships_count || 0) + 1,
                        internships: [...(p.internships || []), { student }]
                    };
                }
                return p;
            }));

            // API Call
            try {
                await api.post('/internships', {
                    student_id: studentId,
                    partner_id: partnerId,
                    period_id: periodId,
                    supervisor_id: supervisorId || null
                });
                toast.success(`Assigned ${student.user?.name || 'Student'}`);
            } catch (error) {
                toast.error('Gagal assign siswa');
                fetchData(); // Revert/Reload on error
            }
        }
    };

    const handleSupervisorChange = (partnerId: number, supervisorId: string) => {
        setPartnerSupervisors(prev => ({ ...prev, [partnerId]: supervisorId }));
    };

    const filteredStudents = unassignedStudents.filter(s =>
        (s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedClass ? s.class?.name === selectedClass : true)
    );

    // Unique classes for filter
    const classes = Array.from(new Set(unassignedStudents.map(s => s.class?.name).filter(Boolean)));

    if (loading) return <div className="p-10 text-center">Loading Data...</div>;

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
        >
            {/* Toolbar Area */}
            <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    <p>Drag siswa dari kiri ke kartu mitra industri di kanan.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">

                {/* LEFT COLUMN: STUDENTS List (Source) */}
                <div className="lg:col-span-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden h-full">
                    <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <User className="w-4 h-4" /> Siswa Belum PKL ({filteredStudents.length})
                        </h3>

                        {/* Filters */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="w-full px-3 py-2 text-sm border rounded-lg"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50/50">
                        {filteredStudents.map((student) => (
                            <DraggableStudent key={student.id} student={student} />
                        ))}
                        {filteredStudents.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                Tidak ada siswa
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: PARTNERS Grid (Drop Targets) */}
                <div className="lg:col-span-3 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                        {partners.map(partner => (
                            <DroppablePartner
                                key={partner.id}
                                partner={partner}
                                teachers={teachers}
                                selectedSupervisor={partnerSupervisors[partner.id] || ''}
                                onSupervisorChange={(val) => handleSupervisorChange(partner.id, val)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-blue-600 text-white p-3 rounded-lg shadow-xl w-64 flex items-center gap-3 opacity-90 cursor-grabbing">
                        <GripVertical className="w-5 h-5 opacity-50" />
                        <span className="font-medium truncate">Moving Student...</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Draggable Component
function DraggableStudent({ student }: { student: Student }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: student.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "bg-white p-3 rounded-lg border shadow-sm flex items-center gap-3 cursor-grab hover:border-blue-500 hover:shadow-md transition-all group touch-none",
                isDragging && "opacity-0" // Hide original while dragging
            )}
        >
            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{student.user?.name || 'Unknown'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-1.5 rounded">{student.class?.name || 'No Class'}</span>
                    {student.department?.name && <span className="bg-gray-100 px-1.5 rounded truncate">{student.department.name}</span>}
                </div>
            </div>
        </div>
    );
}

// Droppable Component
function DroppablePartner({
    partner,
    teachers,
    selectedSupervisor,
    onSupervisorChange
}: {
    partner: Partner,
    teachers: any[],
    selectedSupervisor: string,
    onSupervisorChange: (val: string) => void
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: partner.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "bg-white rounded-xl border-2 transition-all duration-200 flex flex-col h-full min-h-[180px]",
                isOver ? "border-blue-500 bg-blue-50/50 shadow-lg scale-[1.02]" : "border-transparent shadow-sm hover:border-gray-300"
            )}
        >
            <div className="p-4 border-b bg-white rounded-t-xl sticky top-0 z-10 space-y-3">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 truncate pr-2" title={partner.name}>{partner.name}</h4>
                    <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate">{partner.city}</p>

                {/* Supervisor Selector per Partner */}
                <div>
                    <select
                        className="w-full text-xs border rounded-lg px-2 py-1.5 bg-gray-50"
                        value={selectedSupervisor}
                        onChange={(e) => onSupervisorChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent drag issues if any
                    >
                        <option value="">-- Pilih Pembimbing --</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.user_id}>{t.user?.name || t.nip}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                        <strong className="text-gray-900">{partner.internships_count || 0} Siswa</strong>
                    </span>
                    {/* Optional: Add Capacity Limit indicator here */}
                    {partner.quota && (
                        <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            (partner.internships_count || 0) >= partner.quota ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                            Kap: {partner.quota}
                        </span>
                    )}
                </div>
            </div>

            {/* List of assigned students */}
            <div className="p-3 bg-gray-50/50 flex flex-col gap-2 flex-1 rounded-b-xl max-h-[200px] overflow-y-auto">
                {partner.internships?.map((i: any, idx) => (
                    <div key={idx} className="bg-white px-2 py-1.5 rounded border text-xs flex items-center justify-between text-gray-700">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            <span className="truncate">{i.student?.user?.name || i.student?.name}</span>
                        </div>
                    </div>
                ))}
                {(!partner.internships || partner.internships.length === 0) && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs italic py-4">
                        Drop siswa di sini
                    </div>
                )}
            </div>
        </div>
    );
}
