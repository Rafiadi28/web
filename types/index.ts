// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_name: string;
  phone?: string;
  avatar?: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  birth_place?: string;
  religion?: string;
  address?: string;
  is_active: boolean;
  last_login_at?: string;
  teacher?: TeacherProfile;
  student?: StudentProfile;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'kepala_sekolah'
  | 'wakil_kepala'
  | 'guru'
  | 'wali_kelas'
  | 'siswa'
  | 'orang_tua'
  | 'tata_usaha'
  | 'bendahara'
  | 'bk'
  | 'humas';

export interface TeacherProfile {
  id: number;
  nip?: string;
  nuptk?: string;
  status: string;
  department?: string;
  is_homeroom: boolean;
}

export interface StudentProfile {
  id: number;
  nis: string;
  nisn?: string;
  class?: string;
  department?: string;
  entry_year: number;
  status: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Dashboard types
export interface DashboardData {
  user: {
    name: string;
    role: string;
    role_name: string;
  };
  message: string;
  stats?: {
    total_users?: number;
    total_students?: number;
    total_teachers?: number;
    total_departments?: number;
  };
  quick_actions?: string[];
}
