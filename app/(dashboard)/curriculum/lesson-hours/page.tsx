'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Clock,
    Calendar,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    CheckCircle2,
} from 'lucide-react';

type DayGroup = 'mon_thu' | 'fri' | 'sat';

interface BreakConfig {
    after_slot: number;
    duration: number;
}

interface GenerateConfig {
    start_time: string;
    duration_minutes: number;
    max_slots: number;
    breaks: BreakConfig[];
}

const DEFAULT_CONFIGS: Record<DayGroup, GenerateConfig> = {
    mon_thu: {
        start_time: '07:00',
        duration_minutes: 40,
        max_slots: 10,  // Sampai sore
        breaks: [
            { after_slot: 4, duration: 30 }, // Istirahat 1
            { after_slot: 8, duration: 30 }, // Ishoma (Asumsi)
        ],
    },
    fri: {
        start_time: '07:00',
        duration_minutes: 35,
        max_slots: 6,   // Sampai Jumatan
        breaks: [
            { after_slot: 4, duration: 15 },
        ],
    },
    sat: {
        start_time: '07:00',
        duration_minutes: 40,
        max_slots: 6,   // Setengah hari
        breaks: [
            { after_slot: 4, duration: 15 },
        ],
    },
};

export default function LessonHourPage() {
    const [activeTab, setActiveTab] = useState<DayGroup>('mon_thu');
    const [config, setConfig] = useState<GenerateConfig>(DEFAULT_CONFIGS['mon_thu']);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load existing data on mount? 
    // For now, allow generating fresh based on config.
    // Ideally we fetch 'index' first to populate 'slots' if exists.
    useEffect(() => {
        fetchConstructedSchedule();
    }, []);

    // Helper to filter slots for current tab
    const fetchConstructedSchedule = async () => {
        try {
            const res = await api.get('/lesson-hours');
            // Logic to parse existing data into slots state if needed?
            // Actually, we want to show PREVIEW of what we are configuring.
            // But if user opens page, maybe show current active schedule?

            // Let's rely on 'Generate' for now to keep UI simpler.
            // If they want to see current, they can verify in Schedule page.
            // Or we could map response back to 'slots'.

            // Map backend group response to flat slots for current tab
            const groupKey = activeTab === 'mon_thu' ? '1' : (activeTab === 'fri' ? '5' : '6');
            if (res.data.data[groupKey]) {
                setSlots(res.data.data[groupKey]);
            } else {
                handleGenerate(); // Default generate if empty
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Switch config when tab changes
    useEffect(() => {
        setConfig(DEFAULT_CONFIGS[activeTab]);
        setSlots([]); // Clear preview
    }, [activeTab]);

    const handleConfigChange = (field: keyof GenerateConfig, val: any) => {
        setConfig(curr => ({ ...curr, [field]: val }));
    };

    const handleAddBreak = () => {
        setConfig(curr => ({
            ...curr,
            breaks: [...curr.breaks, { after_slot: 1, duration: 15 }]
        }));
    };

    const handleRemoveBreak = (idx: number) => {
        setConfig(curr => ({
            ...curr,
            breaks: curr.breaks.filter((_, i) => i !== idx)
        }));
    };

    const handleUpdateBreak = (idx: number, field: keyof BreakConfig, val: number) => {
        const newBreaks = [...config.breaks];
        newBreaks[idx] = { ...newBreaks[idx], [field]: val };
        setConfig(curr => ({ ...curr, breaks: newBreaks }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/lesson-hours/generate', config);
            setSlots(res.data.data);
        } catch (e) {
            alert('Gagal generate preview');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (slots.length === 0) return;
        setSaving(true);
        try {
            // Determine days for this group
            let days: number[] = [];
            if (activeTab === 'mon_thu') days = [1, 2, 3, 4];
            if (activeTab === 'fri') days = [5];
            if (activeTab === 'sat') days = [6];

            await api.post('/lesson-hours', {
                days,
                slots
            });
            alert('Jadwal jam berhasil disimpan!');
        } catch (e) {
            console.error(e);
            alert('Gagal menyimpan jadwal');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-8 h-8 text-blue-600" />
                        Pengaturan Jam Pelajaran
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Atur durasi jam, waktu istirahat, dan slot per hari.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {(['mon_thu', 'fri', 'sat'] as DayGroup[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab
                                ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        {tab === 'mon_thu' && 'Senin - Kamis'}
                        {tab === 'fri' && 'Jumat'}
                        {tab === 'sat' && 'Sabtu'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Parameter Generator</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Jam Masuk
                                </label>
                                <input
                                    type="time"
                                    value={config.start_time}
                                    onChange={(e) => handleConfigChange('start_time', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Durasi 1 JP (Menit)
                                </label>
                                <input
                                    type="number"
                                    value={config.duration_minutes}
                                    onChange={(e) => handleConfigChange('duration_minutes', Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Total Slot JP
                                </label>
                                <input
                                    type="number"
                                    value={config.max_slots}
                                    onChange={(e) => handleConfigChange('max_slots', Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Jeda Istirahat
                                </label>
                                {config.breaks.map((b, idx) => (
                                    <div key={idx} className="flex gap-2 items-center mb-2">
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-500">Setelah JP ke-</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={b.after_slot}
                                                onChange={(e) => handleUpdateBreak(idx, 'after_slot', Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-500">Durasi (m)</span>
                                            <input
                                                type="number"
                                                min="5"
                                                value={b.duration}
                                                onChange={(e) => handleUpdateBreak(idx, 'duration', Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBreak(idx)}
                                            className="mt-4 p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleAddBreak}
                                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1"
                                >
                                    <Plus className="w-3 h-3" /> Tambah Istirahat
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="mt-6 w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Generate Preview
                        </button>
                    </div>
                </div>

                {/* Preview Result */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h3 className="font-bold text-gray-900 dark:text-white">Preview Jadwal</h3>
                            {slots.length > 0 && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            )}
                        </div>

                        {slots.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Klik tombol GENERATE untuk melihat hasil pengaturan jam.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 bg-gray-50 dark:bg-gray-700/50 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Slot JP</th>
                                            <th className="px-6 py-3">Waktu Mulai</th>
                                            <th className="px-6 py-3">Waktu Selesai</th>
                                            <th className="px-6 py-3">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {slots.map((s, idx) => {
                                            // Check gap with previous to detect break logic visually?
                                            // Since API returns strict JP slots, 'breaks' are naturally gaps.
                                            // We could check if (prev.end != curr.start) to label "Istirahat" row.

                                            const prev = idx > 0 ? slots[idx - 1] : null;
                                            const hasGap = prev && prev.end !== s.start;

                                            // If there's a gap, we render an extra row for visual clarity.
                                            return (
                                                <React.Fragment key={s.slot}>
                                                    {hasGap && (
                                                        <tr className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-500">
                                                            <td className="px-6 py-2 font-bold text-center">-</td>
                                                            <td className="px-6 py-2 font-mono">{prev.end}</td>
                                                            <td className="px-6 py-2 font-mono">{s.start}</td>
                                                            <td className="px-6 py-2 font-medium italic">Istirahat</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-6 py-3 font-medium">Jam Ke-{s.slot}</td>
                                                        <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-300">
                                                            {s.start}
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-300">
                                                            {s.end}
                                                        </td>
                                                        <td className="px-6 py-3">-</td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                        {/* Show End time of last slot as Pulang */}
                                        {slots.length > 0 && (
                                            <tr className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 font-bold border-t border-green-200">
                                                <td className="px-6 py-3 text-center">-</td>
                                                <td className="px-6 py-3 font-mono">{slots[slots.length - 1].end}</td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3">Waktu Pulang</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

