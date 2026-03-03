import type { Presentation } from '../../types';
import { usePresentationStore } from '../../store/presentationStore';
import { formatTime } from '../../utils/timeUtils';
import { Button } from '../shared/Button';
import styles from './PresentationCard.module.css';

interface PresentationCardProps {
  presentation: Presentation;
}

export function PresentationCard({ presentation }: PresentationCardProps) {
  const openEditor = usePresentationStore(s => s.openEditor);
  const duplicatePresentation = usePresentationStore(s => s.duplicatePresentation);
  const deletePresentation = usePresentationStore(s => s.deletePresentation);

  const totalDuration = presentation.sections.reduce(
    (sum, s) => sum + s.originalDurationSec,
    0
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePresentation(presentation.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicatePresentation(presentation.id);
  };

  return (
    <div className={styles.card} onClick={() => openEditor(presentation.id)}>
      <div className={styles.name}>{presentation.name}</div>
      <div className={styles.meta}>
        <span>{presentation.sections.length} sections</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="icon" onClick={handleDuplicate} title="Duplicate">
          ⧉
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete">
          ✕
        </Button>
      </div>
    </div>
  );
}
