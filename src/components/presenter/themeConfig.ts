import type { PresenterTheme } from '../../types';

export interface ThemeConfig {
  overallSize: number;
  overallStroke: number;
  sectionSize: number;
  sectionStroke: number;
  trackColor?: string;
  timeGlow?: string;
  labelInRing: boolean;
  timersHorizontal: boolean;
}

export const THEME_CONFIGS: Record<PresenterTheme, ThemeConfig> = {
  default: {
    overallSize: 380,
    overallStroke: 8,
    sectionSize: 270,
    sectionStroke: 6,
    labelInRing: false,
    timersHorizontal: false,
  },
  compact: {
    overallSize: 400,
    overallStroke: 7,
    sectionSize: 340,
    sectionStroke: 6,
    labelInRing: true,
    timersHorizontal: true,
  },
  'high-contrast': {
    overallSize: 430,
    overallStroke: 12,
    sectionSize: 300,
    sectionStroke: 10,
    labelInRing: false,
    timersHorizontal: false,
  },
  retro: {
    overallSize: 380,
    overallStroke: 8,
    sectionSize: 270,
    sectionStroke: 6,
    trackColor: 'rgba(0, 255, 65, 0.1)',
    timeGlow: '0 0 16px rgba(0, 255, 65, 0.6)',
    labelInRing: false,
    timersHorizontal: false,
  },
  light: {
    overallSize: 350,
    overallStroke: 4,
    sectionSize: 255,
    sectionStroke: 3,
    labelInRing: false,
    timersHorizontal: false,
  },
};

export interface ThemeOption {
  id: PresenterTheme;
  name: string;
  accent: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default', name: 'Default', accent: '#6C63FF', description: 'Dark purple accent' },
  { id: 'compact', name: 'Compact', accent: '#6C63FF', description: 'Side-by-side rings' },
  { id: 'high-contrast', name: 'High Contrast', accent: '#00E5FF', description: 'Bold & readable' },
  { id: 'retro', name: 'Retro Terminal', accent: '#00FF41', description: 'Green-on-black CRT' },
  { id: 'light', name: 'Minimal Light', accent: '#5C6BC0', description: 'Light & refined' },
];
