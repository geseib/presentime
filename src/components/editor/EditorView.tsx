import { usePresentationStore } from '../../store/presentationStore';
import { formatTime } from '../../utils/timeUtils';
import { Button } from '../shared/Button';
import { SectionEditor } from './SectionEditor';
import { SectionForm } from './SectionForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import styles from './EditorView.module.css';

export function EditorView() {
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const goToManager = usePresentationStore(s => s.goToManager);
  const openPresenter = usePresentationStore(s => s.openPresenter);
  const updatePresentationName = usePresentationStore(s => s.updatePresentationName);
  const reorderSections = usePresentationStore(s => s.reorderSections);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!presentation) {
    return (
      <div className={styles.container}>
        <p>Presentation not found.</p>
        <Button onClick={goToManager}>Back to Manager</Button>
      </div>
    );
  }

  const totalDuration = presentation.sections.reduce(
    (sum, s) => sum + s.originalDurationSec,
    0
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = presentation.sections.findIndex(s => s.id === active.id);
    const newIndex = presentation.sections.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...presentation.sections];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorderSections(presentation.id, newOrder.map(s => s.id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" className={styles.backButton} onClick={goToManager}>
          ←
        </Button>
        <input
          className={styles.nameInput}
          value={presentation.name}
          onChange={e => updatePresentationName(presentation.id, e.target.value)}
          placeholder="Presentation name..."
        />
      </div>

      <div className={styles.totalBar}>
        <span className={styles.totalLabel}>
          Total Duration ({presentation.sections.length} sections)
        </span>
        <span className={styles.totalTime}>{formatTime(totalDuration)}</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={presentation.sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.sectionList}>
            {presentation.sections.length === 0 ? (
              <div className={styles.emptyState}>
                No sections yet. Add one below.
              </div>
            ) : (
              presentation.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  presentationId={presentation.id}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      <SectionForm presentationId={presentation.id} />

      <div className={styles.footer}>
        <Button variant="secondary" onClick={goToManager}>
          Back
        </Button>
        <Button
          onClick={() => openPresenter(presentation.id)}
          disabled={presentation.sections.length === 0}
          size="large"
        >
          ▶ Present
        </Button>
      </div>
    </div>
  );
}
