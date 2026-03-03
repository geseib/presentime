import { usePresentationStore } from '../../store/presentationStore';
import { PresentationCard } from './PresentationCard';
import { Button } from '../shared/Button';
import styles from './PresentationManager.module.css';

export function PresentationManager() {
  const presentations = usePresentationStore(s => s.presentations);
  const createPresentation = usePresentationStore(s => s.createPresentation);

  const handleCreate = () => {
    createPresentation('Untitled Presentation');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Presentime</h1>
          <p className={styles.subtitle}>Presentation Timer</p>
        </div>
        <Button onClick={handleCreate} size="large">
          + New Presentation
        </Button>
      </div>

      {presentations.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⏱</div>
          <p className={styles.emptyText}>No presentations yet</p>
          <Button onClick={handleCreate}>Create your first presentation</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {presentations.map(p => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}
    </div>
  );
}
