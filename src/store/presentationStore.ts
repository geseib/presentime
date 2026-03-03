import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode, Presentation, Section } from '../types';

interface PresentationState {
  presentations: Presentation[];
  activePresentationId: string | null;
  mode: AppMode;

  // Mode navigation
  setMode: (mode: AppMode) => void;
  openEditor: (id: string) => void;
  openPresenter: (id: string) => void;
  goToManager: () => void;

  // CRUD
  createPresentation: (name: string) => string;
  duplicatePresentation: (id: string) => void;
  deletePresentation: (id: string) => void;
  updatePresentationName: (id: string, name: string) => void;

  // Section operations
  addSection: (presentationId: string, name: string, durationSec: number) => void;
  updateSection: (presentationId: string, sectionId: string, updates: Partial<Pick<Section, 'name' | 'originalDurationSec'>>) => void;
  deleteSection: (presentationId: string, sectionId: string) => void;
  reorderSections: (presentationId: string, sectionIds: string[]) => void;

  // Selectors
  getActivePresentation: () => Presentation | null;
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      presentations: [],
      activePresentationId: null,
      mode: 'manager' as AppMode,

      setMode: (mode) => set({ mode }),

      openEditor: (id) => set({ mode: 'editor', activePresentationId: id }),

      openPresenter: (id) => set({ mode: 'presenter', activePresentationId: id }),

      goToManager: () => set({ mode: 'manager', activePresentationId: null }),

      createPresentation: (name) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        set(state => ({
          presentations: [
            ...state.presentations,
            { id, name, sections: [], createdAt: now, updatedAt: now },
          ],
          activePresentationId: id,
          mode: 'editor' as AppMode,
        }));
        return id;
      },

      duplicatePresentation: (id) => {
        const source = get().presentations.find(p => p.id === id);
        if (!source) return;
        const newId = crypto.randomUUID();
        const now = Date.now();
        set(state => ({
          presentations: [
            ...state.presentations,
            {
              ...source,
              id: newId,
              name: `${source.name} (copy)`,
              sections: source.sections.map(s => ({
                ...s,
                id: crypto.randomUUID(),
              })),
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
      },

      deletePresentation: (id) => {
        set(state => ({
          presentations: state.presentations.filter(p => p.id !== id),
          activePresentationId:
            state.activePresentationId === id ? null : state.activePresentationId,
        }));
      },

      updatePresentationName: (id, name) => {
        set(state => ({
          presentations: state.presentations.map(p =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
      },

      addSection: (presentationId, name, durationSec) => {
        const section: Section = {
          id: crypto.randomUUID(),
          name,
          originalDurationSec: durationSec,
          adjustedDurationSec: durationSec,
        };
        set(state => ({
          presentations: state.presentations.map(p =>
            p.id === presentationId
              ? { ...p, sections: [...p.sections, section], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateSection: (presentationId, sectionId, updates) => {
        set(state => ({
          presentations: state.presentations.map(p =>
            p.id === presentationId
              ? {
                  ...p,
                  sections: p.sections.map(s =>
                    s.id === sectionId
                      ? {
                          ...s,
                          ...updates,
                          adjustedDurationSec: updates.originalDurationSec ?? s.adjustedDurationSec,
                          originalDurationSec: updates.originalDurationSec ?? s.originalDurationSec,
                        }
                      : s
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteSection: (presentationId, sectionId) => {
        set(state => ({
          presentations: state.presentations.map(p =>
            p.id === presentationId
              ? {
                  ...p,
                  sections: p.sections.filter(s => s.id !== sectionId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      reorderSections: (presentationId, sectionIds) => {
        set(state => ({
          presentations: state.presentations.map(p => {
            if (p.id !== presentationId) return p;
            const sectionMap = new Map(p.sections.map(s => [s.id, s]));
            const reordered = sectionIds
              .map(id => sectionMap.get(id))
              .filter((s): s is Section => s !== undefined);
            return { ...p, sections: reordered, updatedAt: Date.now() };
          }),
        }));
      },

      getActivePresentation: () => {
        const { presentations, activePresentationId } = get();
        return presentations.find(p => p.id === activePresentationId) ?? null;
      },
    }),
    {
      name: 'presentime-presentations',
      partialize: (state) => ({
        presentations: state.presentations,
      }),
    }
  )
);
