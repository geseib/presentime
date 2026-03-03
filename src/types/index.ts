export interface Section {
  id: string;
  name: string;
  originalDurationSec: number;
  adjustedDurationSec: number;
}

export interface Presentation {
  id: string;
  name: string;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

export type AppMode = 'manager' | 'editor' | 'presenter';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type WarningLevel = 'ok' | 'caution' | 'danger' | 'overtime';

export interface SectionRuntimeState {
  sectionId: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  elapsedSec: number;
  originalDurationSec: number;
  adjustedDurationSec: number;
}
