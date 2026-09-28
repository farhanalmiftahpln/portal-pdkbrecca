import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 
  | 'MUP UP3' | 'KEPALA OPERASI' | 'SPV K3L' | 'MUL ULP' 
  | 'SPV PDKB' | 'PELAKSANA' | 'ADMIN' | 'PENGAWAS K3' 
  | 'KEPALA REGU' | 'PREPARATOR' | 'SURVEYOR' | 'INISIATOR' | '';

export interface User {
  nip: string;
  name: string;
  role: UserRole;
  jabatan: string;
  bidang?: string;
  photoUrl?: string;
  unit?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
