import type { WarningLevel } from '../types';

export const WARNING_THRESHOLDS = {
  caution: 0.25,
  danger: 0.10,
} as const;

export const WARNING_COLORS: Record<WarningLevel, string> = {
  ok: '#00E676',
  caution: '#FFD600',
  danger: '#FF1744',
  overtime: '#FF1744',
};

export const FLASH_INTERVALS: Record<WarningLevel, number> = {
  ok: 0,
  caution: 2,
  danger: 0.8,
  overtime: 0.4,
};

export const MIN_SECTION_DURATION_SEC = 15;

export const COLORS = {
  bg: '#0A0A0F',
  panel: '#1E1E2E',
  panelHover: '#2A2A3E',
  text: '#F0F0F5',
  textDim: '#8888A0',
  border: '#333350',
  accent: '#6C63FF',
  accentHover: '#7B73FF',
  danger: '#FF1744',
  success: '#00E676',
} as const;
