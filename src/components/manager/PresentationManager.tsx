import { usePresentationStore, systemPresentations } from '../../store/presentationStore';
import { openFilePicker, importPresentation } from '../../utils/importExport';
import { PresentationCard } from './PresentationCard';
import { Button } from '../shared/Button';
import styles from './PresentationManager.module.css';

export function PresentationManager() {
  const userPresentations = usePresentationStore(s => s.presentations);
  const createPresentation = usePresentationStore(s => s.createPresentation);
  const storeImport = usePresentationStore(s => s.importPresentation);
  const templates = systemPresentations;

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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Templates</h2>
        <div className={styles.grid}>
          {templates.map(p => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      </section>

      {userPresentations.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>My Presentations</h2>
          <div className={styles.grid}>
            {userPresentations.map(p => (
              <PresentationCard key={p.id} presentation={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
