/** Mirror of src/utils/constants.ts WARNING_COLORS */
export const WARNING_COLORS = {
  ok: '#00E676',
  caution: '#FFD600',
  danger: '#FF1744',
  overtime: '#FF1744',
} as const;

/** Lightning Talk: 4 sections, 300s total */
export const LIGHTNING_TALK = {
  name: 'Lightning Talk',
  totalDuration: 300,
  sections: [
    { name: 'Hook', duration: 30 },
    { name: 'The One Big Idea', duration: 90 },
    { name: 'Evidence / Story', duration: 120 },
    { name: 'So What?', duration: 60 },
  ],
} as const;

/** Project Pitch: 5 sections, 600s total */
export const PROJECT_PITCH = {
  name: 'Project Pitch',
  totalDuration: 600,
  sections: [
    { name: 'The Problem', duration: 120 },
    { name: 'Our Approach', duration: 120 },
    { name: 'Demo / How It Works', duration: 180 },
    { name: 'Timeline & Resources', duration: 120 },
    { name: 'The Ask', duration: 60 },
  ],
} as const;

/** Pace engine thresholds (mirror of src/utils/paceEngine.ts) */
export const PACE_THRESHOLDS = {
  cautionFraction: 0.03,
  dangerFraction: 0.10,
} as const;

export const PACE_DEAD_ZONE_SEC = 2;

export const SECTION_WARNING_FLOORS = {
  cautionSec: 45,
  dangerSec: 15,
} as const;

export const SECTION_PERCENT = {
  caution: 0.25,
  danger: 0.10,
} as const;

export const PROJECTION_THRESHOLDS = {
  okFraction: 0.05,
  cautionFraction: 0.15,
} as const;

/** localStorage key used by presentationStore persist middleware */
export const PERSIST_KEY = 'presentime-presentations';
