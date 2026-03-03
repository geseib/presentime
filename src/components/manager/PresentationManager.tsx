import { usePresentationStore } from '../../store/presentationStore';
import { openFilePicker, importPresentation } from '../../utils/importExport';
import { samplePresentation } from '../../data/samplePresentation';
import { PresentationCard } from './PresentationCard';
import { Button } from '../shared/Button';
import styles from './PresentationManager.module.css';

export function PresentationManager() {
  const presentations = usePresentationStore(s => s.presentations);
  const createPresentation = usePresentationStore(s => s.createPresentation);
  const storeImport = usePresentationStore(s => s.importPresentation);

  const handleCreate = () => {
    createPresentation('Untitled Presentation');
  };

  const handleImport = async () => {
    try {
      const json = await openFilePicker();
      const data = importPresentation(json);
      storeImport(data.name, data.sections);
    } catch (err) {
      if (err instanceof Error && err.message === 'No file selected.') return;
      alert(err instanceof Error ? err.message : 'Failed to import presentation.');
    }
  };

  const handleLoadSample = () => {
    storeImport(samplePresentation.name, samplePresentation.sections);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Presentime</h1>
          <p className={styles.subtitle}>Presentation Timer</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleImport}>
            Import
          </Button>
          <Button onClick={handleCreate} size="large">
            + New Presentation
          </Button>
        </div>
      </div>

      {presentations.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⏱</div>
          <p className={styles.emptyText}>No presentations yet</p>
          <Button onClick={handleCreate}>Create your first presentation</Button>
          <Button variant="ghost" onClick={handleLoadSample}>
            Load Sample Presentation
          </Button>
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
