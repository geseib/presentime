import { create } from 'zustand';
import type { TimerStatus, SectionRuntimeState, Presentation } from '../types';
import { redistributeOvertime } from '../utils/redistributionEngine';

interface TimerState {
  status: TimerStatus;
  sections: SectionRuntimeState[];
  activeSectionIndex: number;
  totalElapsedSec: number;
  totalDurationSec: number;
  targetFinishTime: number | null;
  startedAtEpochMs: number | null;

  // Actions
  initialize: (presentation: Presentation) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: (deltaSec: number) => void;
  completeCurrentSection: () => void;
  skipCurrentSection: () => void;
  jumpToSection: (targetIndex: number) => void;
  goToPreviousSection: () => void;
  insertBreakAt: (index: number, durationSec: number) => void;
  setTargetFinishTime: (epochMs: number) => void;

  // Derived getters
  getActiveSection: () => SectionRuntimeState | null;
  getSectionRemaining: () => number;
  getTotalRemaining: () => number;
  getExtraTimeSec: () => number;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  status: 'idle',
  sections: [],
  activeSectionIndex: -1,
  totalElapsedSec: 0,
  totalDurationSec: 0,
  targetFinishTime: null,
  startedAtEpochMs: null,

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
      targetFinishTime: null,
      startedAtEpochMs: null,
    });
  },

  start: () => {
    const { sections, targetFinishTime, totalDurationSec } = get();
    if (sections.length === 0) return;

    const updated = sections.map((s, i) =>
      i === 0 ? { ...s, status: 'active' as const } : s
    );

    const nowMs = Date.now();

    set({
      status: 'running',
      sections: updated,
      activeSectionIndex: 0,
      startedAtEpochMs: nowMs,
      // Lock in finish time if not already set by user
      targetFinishTime: targetFinishTime ?? (nowMs + totalDurationSec * 1000),
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
      targetFinishTime: null,
      startedAtEpochMs: null,
    });
  },

  tick: (deltaSec: number) => {
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

    // Shrink remaining sections if overrun (but don't redistribute saved time — it goes to extra bucket)
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

    // Saved time goes to extra bucket — no redistribution

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

  jumpToSection: (targetIndex: number) => {
    const { sections, activeSectionIndex, status } = get();
    if (status !== 'running' && status !== 'paused') return;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    if (targetIndex === activeSectionIndex) return;

    let updated = [...sections];

    if (targetIndex > activeSectionIndex) {
      // Forward jump: skip intermediate sections (saved time goes to extra bucket)
      for (let i = activeSectionIndex; i < targetIndex; i++) {
        updated[i] = { ...updated[i], status: 'skipped' as const };
      }
    } else {
      // Backward jump: reset intermediate + current to pending but keep elapsed time
      for (let i = targetIndex; i <= activeSectionIndex; i++) {
        updated[i] = {
          ...updated[i],
          status: 'pending' as const,
          adjustedDurationSec: updated[i].originalDurationSec,
        };
      }
    }

    // Activate the target section, resuming from its previous elapsed time
    updated[targetIndex] = { ...updated[targetIndex], status: 'active' as const };

    // Recalculate totalDurationSec but NEVER rewind totalElapsedSec —
    // wall-clock time that has passed cannot be recovered by jumping back.
    const totalDurationSec = updated.reduce((sum, s) => sum + s.adjustedDurationSec, 0);

    set({
      sections: updated,
      activeSectionIndex: targetIndex,
      totalDurationSec,
    });
  },

  goToPreviousSection: () => {
    const { activeSectionIndex } = get();
    if (activeSectionIndex > 0) {
      get().jumpToSection(activeSectionIndex - 1);
    }
  },

  insertBreakAt: (index: number, durationSec: number) => {
    const { sections, activeSectionIndex, totalDurationSec } = get();
    if (index < 0 || index > sections.length) return;

    const breakSection: SectionRuntimeState = {
      sectionId: `break-${Date.now()}`,
      status: 'pending' as const,
      elapsedSec: 0,
      originalDurationSec: durationSec,
      adjustedDurationSec: durationSec,
      isBreak: true,
      name: 'Break',
    };

    const updated = [...sections];
    updated.splice(index, 0, breakSection);

    // If inserted before or at active section, shift the active index
    const newActiveIndex = index <= activeSectionIndex
      ? activeSectionIndex + 1
      : activeSectionIndex;

    set({
      sections: updated,
      activeSectionIndex: newActiveIndex,
      totalDurationSec: totalDurationSec + durationSec,
    });
  },

  setTargetFinishTime: (epochMs: number) => {
    const { sections, status } = get();

    if (status === 'idle') {
      // Pre-start: scale all sections proportionally to fit the new finish time
      const currentTotal = sections.reduce((sum, s) => sum + s.adjustedDurationSec, 0);
      const desiredTotal = Math.max(0, (epochMs - Date.now()) / 1000);
      if (currentTotal <= 0) return;

      const scale = desiredTotal / currentTotal;
      const updated = sections.map(s => ({
        ...s,
        adjustedDurationSec: Math.max(1, Math.round(s.adjustedDurationSec * scale)),
      }));
      const newTotal = updated.reduce((sum, s) => sum + s.adjustedDurationSec, 0);

      set({ sections: updated, totalDurationSec: newTotal, targetFinishTime: epochMs });
    } else {
      // Running/paused: just move the deadline — don't rescale sections.
      // The UI will warn if content exceeds the target.
      set({ targetFinishTime: epochMs });
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

  getExtraTimeSec: () => {
    const { sections } = get();
    return sections.reduce((sum, s) => {
      if (s.status === 'completed' || s.status === 'skipped') {
        const saved = s.adjustedDurationSec - s.elapsedSec;
        return sum + Math.max(0, saved);
      }
      return sum;
    }, 0);
  },
}));
