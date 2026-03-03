import { useState, useCallback } from 'react';
import { parseDuration, formatTime } from '../../utils/timeUtils';
import styles from './DurationInput.module.css';

interface DurationInputProps {
  value: number; // seconds
  onChange: (seconds: number) => void;
  placeholder?: string;
}

export function DurationInput({ value, onChange, placeholder = 'MM:SS' }: DurationInputProps) {
  const [text, setText] = useState(() => formatTime(value));
  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setText(raw);

      const parsed = parseDuration(raw);
      if (parsed !== null && parsed > 0) {
        setIsValid(true);
        onChange(parsed);
      } else {
        setIsValid(false);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // On blur, reformat to canonical form
    const parsed = parseDuration(text);
    if (parsed !== null && parsed > 0) {
      setText(formatTime(parsed));
      setIsValid(true);
    } else {
      // Revert to the last valid value
      setText(formatTime(value));
      setIsValid(true);
    }
  }, [text, value]);

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        className={`${styles.input} ${!isValid ? styles.invalid : ''}`}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputMode="numeric"
      />
    </div>
  );
}
