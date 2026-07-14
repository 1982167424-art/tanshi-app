import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme: resolved });
        applyTheme(resolved);
      },
      initTheme: () => {
        const state = get();
        const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
        set({ resolvedTheme: resolved });
        applyTheme(resolved);

        // Listen to system theme changes when in system mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => {
          const current = get();
          if (current.theme === 'system') {
            const newResolved = e.matches ? 'dark' : 'light';
            set({ resolvedTheme: newResolved });
            applyTheme(newResolved);
          }
        };
        mediaQuery.addEventListener('change', listener);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
