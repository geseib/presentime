import { useState, useCallback } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { DurationInput } from '../shared/DurationInput';
import { Button } from '../shared/Button';
import styles from './SectionForm.module.css';

interface SectionFormProps {
  presentationId: string;
}

export function SectionForm({ presentationId }: SectionFormProps) {
  const addSection = usePresentationStore(s => s.addSection);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(120); // Default 2 minutes

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sectionName = name.trim() || 'Untitled Section';
      addSection(presentationId, sectionName, duration);
      setName('');
      setDuration(120);
    },
    [addSection, presentationId, name, duration]
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.nameInput}
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New section name..."
      />
      <DurationInput value={duration} onChange={setDuration} />
      <Button type="submit">+ Add</Button>
    </form>
  );
}
