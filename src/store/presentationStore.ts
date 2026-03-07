import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode, Presentation, Section } from '../types';
import { systemPresentationData } from '../data/systemPresentations';

// Stable IDs for system presentations so they don't duplicate on reload
const SYSTEM_IDS = [
  'system-quarterly-team-update',
  'system-project-pitch',
  'system-workshop-training-session',
  'system-lightning-talk',
];

function buildSystemPresentations(): Presentation[] {
  const now = Date.now();
  return systemPresentationData.map((data, i) => ({
    id: SYSTEM_IDS[i],
    name: data.name,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
    sections: data.sections.map((s, j) => ({
      id: `${SYSTEM_IDS[i]}-section-${j}`,
      name: s.name,
      originalDurationSec: s.durationSec,
      adjustedDurationSec: s.durationSec,
    })),
  }));
}

export const systemPresentations = buildSystemPresentations();

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

  // Import
  importPresentation: (name: string, sections: { name: string; durationSec: number }[]) => void;

  // Selectors
  getActivePresentation: () => Presentation | null;
  getAllPresentations: () => Presentation[];
}

function isSystemPresentation(id: string): boolean {
  return SYSTEM_IDS.includes(id);
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      presentations: [],
      activePresentationId: null,
      mode: 'manager' as AppMode,

      setMode: (mode) => set({ mode }),

      openEditor: (id) => {
        if (isSystemPresentation(id)) {
          // Copy-on-edit: duplicate the system presentation as a user presentation
          const source = systemPresentations.find(p => p.id === id);
          if (!source) return;
          const newId = crypto.randomUUID();
          const now = Date.now();
          set(state => ({
            presentations: [
              ...state.presentations,
              {
                ...source,
                id: newId,
                isSystem: undefined,
                sections: source.sections.map(s => ({
                  ...s,
                  id: crypto.randomUUID(),
                })),
                createdAt: now,
                updatedAt: now,
              },
            ],
            activePresentationId: newId,
            mode: 'editor' as AppMode,
          }));
        } else {
          set({ mode: 'editor', activePresentationId: id });
        }
      },

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
        // For system presentations, look in systemPresentations array
        const allPresentations = [...systemPresentations, ...get().presentations];
        const source = allPresentations.find(p => p.id === id);
        if (!source) return;
        const newId = crypto.randomUUID();
        const now = Date.now();
        set(state => ({
          presentations: [
            ...state.presentations,
            {
              ...source,
              id: newId,
              isSystem: undefined,
              name: source.isSystem ? source.name : `${source.name} (copy)`,
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
        if (isSystemPresentation(id)) return;
        set(state => ({
          presentations: state.presentations.filter(p => p.id !== id),
          activePresentationId:
            state.activePresentationId === id ? null : state.activePresentationId,
        }));
      },

      updatePresentationName: (id, name) => {
        if (isSystemPresentation(id)) return;
        set(state => ({
          presentations: state.presentations.map(p =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
      },

      addSection: (presentationId, name, durationSec) => {
        if (isSystemPresentation(presentationId)) return;
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
        if (isSystemPresentation(presentationId)) return;
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
        if (isSystemPresentation(presentationId)) return;
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
        if (isSystemPresentation(presentationId)) return;
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

      importPresentation: (name, sections) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newSections: Section[] = sections.map(s => ({
          id: crypto.randomUUID(),
          name: s.name,
          originalDurationSec: s.durationSec,
          adjustedDurationSec: s.durationSec,
        }));
        set(state => ({
          presentations: [
            ...state.presentations,
            { id, name, sections: newSections, createdAt: now, updatedAt: now },
          ],
          activePresentationId: id,
          mode: 'editor' as AppMode,
        }));
      },

      getActivePresentation: () => {
        const { presentations, activePresentationId } = get();
        const all = [...systemPresentations, ...presentations];
        return all.find(p => p.id === activePresentationId) ?? null;
      },

      getAllPresentations: () => {
        return [...systemPresentations, ...get().presentations];
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
