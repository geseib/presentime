import { create } from 'zustand';
import type { TimerStatus, SectionRuntimeState, Presentation } from '../types';
import { redistributeOvertime } from '../utils/redistributionEngine';

interface TimerState {
  status: TimerStatus;
  sections: SectionRuntimeState[];
  activeSectionIndex: number;
  totalElapsedSec: number;
  totalDurationSec: number;

  // Actions
  initialize: (presentation: Presentation) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: (deltaSec: number) => void;
  completeCurrentSection: () => void;
  skipCurrentSection: () => void;

  // Derived getters
  getActiveSection: () => SectionRuntimeState | null;
  getSectionRemaining: () => number;
  getTotalRemaining: () => number;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  status: 'idle',
  sections: [],
  activeSectionIndex: -1,
  totalElapsedSec: 0,
  totalDurationSec: 0,

  initialize: (presentation) => {
    const sections: SectionRuntimeState[] = presentation.sections.map(s => ({
      sectionId: s.id,
      status: 'pending',
      elapsedSec: 0,
      originalDurationSec: s.originalDurationSec,
      adjustedDurationSec: s.adjustedDurationSec,
    }));

    const totalDuration = sections.reduce((sum, s) => sum + s.adjustedDurationSec, 0);

    set({
      status: 'idle',
      sections,
      activeSectionIndex: -1,
      totalElapsedSec: 0,
      totalDurationSec: totalDuration,
    });
  },

  start: () => {
    const { sections } = get();
    if (sections.length === 0) return;

    const updated = sections.map((s, i) =>
      i === 0 ? { ...s, status: 'active' as const } : s
    );

    set({
      status: 'running',
      sections: updated,
      activeSectionIndex: 0,
    });
  },

  pause: () => {
    if (get().status === 'running') {
      set({ status: 'paused' });
    }
  },

  resume: () => {
    if (get().status === 'paused') {
      set({ status: 'running' });
    }
  },

  reset: () => {
    const { sections } = get();
    const resetSections = sections.map(s => ({
      ...s,
      status: 'pending' as const,
      elapsedSec: 0,
      adjustedDurationSec: s.originalDurationSec,
    }));

    const totalDuration = resetSections.reduce((sum, s) => sum + s.adjustedDurationSec, 0);

    set({
      status: 'idle',
      sections: resetSections,
      activeSectionIndex: -1,
      totalElapsedSec: 0,
      totalDurationSec: totalDuration,
    });
  },

  tick: (deltaSec) => {
    const { status, activeSectionIndex, sections } = get();
    if (status !== 'running' || activeSectionIndex < 0) return;

    const updated = [...sections];
    const active = { ...updated[activeSectionIndex] };
    active.elapsedSec += deltaSec;
    updated[activeSectionIndex] = active;

    set({
      sections: updated,
      totalElapsedSec: get().totalElapsedSec + deltaSec,
    });
  },

  completeCurrentSection: () => {
    const { sections, activeSectionIndex, status } = get();
    if (activeSectionIndex < 0 || status === 'idle') return;

    let updated = sections.map((s, i) =>
      i === activeSectionIndex ? { ...s, status: 'completed' as const } : s
    );

    // Redistribute overtime
    const completedSection = updated[activeSectionIndex];
    updated = redistributeOvertime(updated, completedSection.sectionId);

    // Find next pending section
    const nextIndex = updated.findIndex(
      (s, i) => i > activeSectionIndex && s.status === 'pending'
    );

    if (nextIndex >= 0) {
      updated = updated.map((s, i) =>
        i === nextIndex ? { ...s, status: 'active' as const } : s
      );
      set({ sections: updated, activeSectionIndex: nextIndex });
    } else {
      // All sections completed
      set({
        sections: updated,
        activeSectionIndex: -1,
        status: 'finished',
      });
    }
  },

  skipCurrentSection: () => {
    const { sections, activeSectionIndex } = get();
    if (activeSectionIndex < 0) return;

    let updated = sections.map((s, i) =>
      i === activeSectionIndex ? { ...s, status: 'skipped' as const } : s
    );

    const nextIndex = updated.findIndex(
      (s, i) => i > activeSectionIndex && s.status === 'pending'
    );

    if (nextIndex >= 0) {
      updated = updated.map((s, i) =>
        i === nextIndex ? { ...s, status: 'active' as const } : s
      );
      set({ sections: updated, activeSectionIndex: nextIndex });
    } else {
      set({ sections: updated, activeSectionIndex: -1, status: 'finished' });
    }
  },

  getActiveSection: () => {
    const { sections, activeSectionIndex } = get();
    return activeSectionIndex >= 0 ? sections[activeSectionIndex] : null;
  },

  getSectionRemaining: () => {
    const active = get().getActiveSection();
    if (!active) return 0;
    return active.adjustedDurationSec - active.elapsedSec;
  },

  getTotalRemaining: () => {
    const { sections, totalDurationSec, totalElapsedSec } = get();
    if (sections.length === 0) return 0;
    return totalDurationSec - totalElapsedSec;
  },
}));
