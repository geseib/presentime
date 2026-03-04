import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PresenterTheme } from '../types';

interface ThemeState {
  theme: PresenterTheme;
  setTheme: (theme: PresenterTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'presentime-theme',
    }
  )
);
