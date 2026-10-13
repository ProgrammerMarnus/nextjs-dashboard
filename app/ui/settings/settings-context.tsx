'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Settings model
// ---------------------------------------------------------------------------

export const THEMES = {
  light: { label: 'Light', mode: 'light', accent: '#0072B2' },
  dark: { label: 'Dark', mode: 'dark', accent: '#3B82F6' },
  midnight: { label: 'Midnight', mode: 'dark', accent: '#818CF8' },
  forest: { label: 'Forest', mode: 'dark', accent: '#34D399' },
  ocean: { label: 'Ocean', mode: 'dark', accent: '#22D3EE' },
} as const;

export type ThemeName = keyof typeof THEMES;
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export const CHART_OPTIONS = [
  { key: 'patients-bar', label: 'Bar', title: 'New Patients per Month', group: 'New Patients' },
  { key: 'patients-area', label: 'Area', title: 'New Patients per Month', group: 'New Patients' },
  { key: 'patients-line', label: 'Line', title: 'New Patients per Month', group: 'New Patients' },
  { key: 'status-donut', label: 'Donut', title: 'Appointment Status', group: 'Appointment Status' },
  { key: 'status-pie', label: 'Pie', title: 'Appointment Status', group: 'Appointment Status' },
  { key: 'status-bar', label: 'Bar', title: 'Appointment Status', group: 'Appointment Status' },
] as const;

export type ChartKey = (typeof CHART_OPTIONS)[number]['key'];

export type UpcomingMode = 'count' | 'window';
export type UpcomingWindow = 'today' | 'week' | 'month' | 'all';

export type Settings = {
  theme: ThemeName;
  chartSlots: [ChartKey, ChartKey];
  upcomingMode: UpcomingMode;
  upcomingLimit: number;
  upcomingWindow: UpcomingWindow;
};

const DEFAULTS: Settings = {
  theme: 'light',
  chartSlots: ['patients-bar', 'status-donut'],
  upcomingMode: 'count',
  upcomingLimit: 3,
  upcomingWindow: 'week',
};

const STORAGE_KEY = 'cura-settings-v1';

type SettingsContextValue = {
  settings: Settings;
  isDark: boolean;
  accent: string;
  setTheme: (theme: ThemeName) => void;
  setChartSlot: (index: 0 | 1, key: ChartKey) => void;
  setUpcoming: (patch: Partial<Pick<Settings, 'upcomingMode' | 'upcomingLimit' | 'upcomingWindow'>>) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const clampLimit = (n: number) => Math.min(12, Math.max(1, Math.round(Number.isFinite(n) ? n : 3)));

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULTS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const loadedRef = useRef(false);

  // Mark as loaded after first render (defaults render first so SSR/hydration match).
  useEffect(() => {
    loadedRef.current = true;
  }, []);

  // Persist + reflect theme on <html>.
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage may be unavailable */
    }
    const root = document.documentElement;
    THEME_NAMES.forEach((t) => root.classList.remove(`theme-${t}`));
    root.classList.add(`theme-${settings.theme}`);
    root.classList.toggle('scheme-dark', THEMES[settings.theme].mode === 'dark');
  }, [settings]);

  const setTheme = useCallback((theme: ThemeName) => {
    setSettings((s) => ({ ...s, theme }));
  }, []);

  // Keep exactly two distinct charts: if the chosen key is already in the other
  // slot, swap the two so both slots always show a different chart.
  const setChartSlot = useCallback((index: 0 | 1, key: ChartKey) => {
    setSettings((s) => {
      const next: [ChartKey, ChartKey] = [...s.chartSlots];
      const other = index === 0 ? 1 : 0;
      if (next[other] === key) next[other] = s.chartSlots[index];
      next[index] = key;
      return { ...s, chartSlots: next };
    });
  }, []);

  const setUpcoming = useCallback(
    (patch: Partial<Pick<Settings, 'upcomingMode' | 'upcomingLimit' | 'upcomingWindow'>>) => {
      setSettings((s) => ({
        ...s,
        ...patch,
        upcomingLimit: patch.upcomingLimit !== undefined ? clampLimit(patch.upcomingLimit) : s.upcomingLimit,
      }));
    },
    [],
  );

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isDark: THEMES[settings.theme].mode === 'dark',
      accent: THEMES[settings.theme].accent,
      setTheme,
      setChartSlot,
      setUpcoming,
      reset,
    }),
    [settings, setTheme, setChartSlot, setUpcoming, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
