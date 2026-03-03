import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Section } from '../../types';
import { usePresentationStore } from '../../store/presentationStore';
import { DurationInput } from '../shared/DurationInput';
import { Button } from '../shared/Button';
import styles from './SectionEditor.module.css';

interface SectionEditorProps {
  section: Section;
  index: number;
  presentationId: string;
}

export function SectionEditor({ section, index, presentationId }: SectionEditorProps) {
  const updateSection = usePresentationStore(s => s.updateSection);
  const deleteSection = usePresentationStore(s => s.deleteSection);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.row} ${isDragging ? styles.dragging : ''}`}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        ⠿
      </span>
      <span className={styles.index}>{index + 1}</span>
      <input
        className={styles.nameInput}
        value={section.name}
        onChange={e =>
          updateSection(presentationId, section.id, { name: e.target.value })
        }
        placeholder="Section name..."
      />
      <DurationInput
        value={section.originalDurationSec}
        onChange={sec =>
          updateSection(presentationId, section.id, { originalDurationSec: sec })
        }
      />
      <Button
        variant="ghost"
        size="icon"
        className={styles.deleteBtn}
        onClick={() => deleteSection(presentationId, section.id)}
        title="Delete section"
      >
        ✕
      </Button>
    </div>
  );
}
