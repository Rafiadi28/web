'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn, GraduationCap, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email dan password harus diisi');
            return;
        }

        const result = await login(email, password);

        if (result?.success) {
            router.push('/dashboard');
        } else {
            console.error('Login Error Detail:', result);
            const errorMessage = result?.message || 'Terjadi kesalahan. Pastikan server Laravel berjalan.';
            // Show alert for better debugging on mobile
            if (errorMessage.includes('Network') || errorMessage.includes('fail')) {
                alert(`Koneksi Gagal: ${errorMessage}\nPastikan HP terhubung ke WiFi yang sama dan IP Server benar.`);
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 animate-gradient">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl"></div>
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <GraduationCap className="w-12 h-12" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Sistem Manajemen</h1>
                            <p className="text-blue-200 text-lg">SMK Kurikulum Merdeka</p>
                        </div>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <h2 className="text-4xl font-bold leading-tight">
                            Kelola Sekolah Anda dengan Mudah & Modern
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Platform terintegrasi untuk manajemen akademik, presensi, penilaian,
                            CBT, PKL, dan keuangan sekolah.
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-3xl font-bold">1000+</div>
                                <div className="text-blue-200 text-sm">Siswa Terdaftar</div>
                            </div>
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-3xl font-bold">50+</div>
                                <div className="text-blue-200 text-sm">Guru Aktif</div>
                            </div>
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-3xl font-bold">8</div>
                                <div className="text-blue-200 text-sm">Kompetensi Keahlian</div>
                            </div>
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-3xl font-bold">99%</div>
                                <div className="text-blue-200 text-sm">Uptime Sistem</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="p-3 bg-blue-600 rounded-xl">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            Sistem SMK
                        </span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Selamat Datang! 👋
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Silakan login untuk melanjutkan
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email / NIS / NIP
                                </label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Masukan Email, NIS, atau NIP"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 outline-none"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200 outline-none pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                             dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400">Ingat saya</span>
                                </label>
                                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Lupa password?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 
                         hover:from-blue-700 hover:to-blue-800 text-white font-semibold 
                         rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40
                         transition-all duration-300 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        <span>Masuk</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Quick Login for Demo */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Demo Login Cepat
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { role: 'Admin', email: 'admin@smk-contoh.sch.id', pass: 'admin123' },
                                    { role: 'Guru', email: 'budi.santoso@smk-contoh.sch.id', pass: 'guru123' },
                                    { role: 'Siswa', email: 'dewi.lestari@smk-contoh.sch.id', pass: 'siswa123' },
                                    { role: 'Super Admin', email: 'superadmin@smk-contoh.sch.id', pass: 'superadmin123' },
                                ].map((demo) => (
                                    <button
                                        key={demo.role}
                                        type="button"
                                        onClick={() => {
                                            setEmail(demo.email);
                                            setPassword(demo.pass);
                                        }}
                                        className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 
                             text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 
                             dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {demo.role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                        © 2024 Sistem Manajemen SMK. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
