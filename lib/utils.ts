import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
        super_admin: 'bg-purple-500',
        admin: 'bg-blue-500',
        kepala_sekolah: 'bg-amber-500',
        wakil_kepala: 'bg-orange-500',
        guru: 'bg-green-500',
        wali_kelas: 'bg-teal-500',
        siswa: 'bg-cyan-500',
        orang_tua: 'bg-pink-500',
        tata_usaha: 'bg-indigo-500',
        bendahara: 'bg-emerald-500',
        bk: 'bg-rose-500',
    };
    return colors[role] || 'bg-gray-500';
}

export function formatCurrency(amount: number | string): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(amount));
}
