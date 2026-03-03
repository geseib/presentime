/**
 * Format seconds into MM:SS or H:MM:SS display string.
 * Negative values (overtime) are prefixed with "+".
 */
export function formatTime(totalSeconds: number): string {
  const isOvertime = totalSeconds < 0;
  const abs = Math.abs(Math.ceil(totalSeconds));
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const prefix = isOvertime ? '+' : '';

  if (hours > 0) {
    return `${prefix}${hours}:${mm}:${ss}`;
  }
  return `${prefix}${mm}:${ss}`;
}

/**
 * Parse a "MM:SS" or "H:MM:SS" string into total seconds.
 * Returns null if the format is invalid.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  const parts = trimmed.split(':').map(Number);

  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    const [min, sec] = parts;
    if (min < 0 || sec < 0 || sec >= 60) return null;
    return min * 60 + sec;
  }

  if (parts.length === 3) {
    const [hr, min, sec] = parts;
    if (hr < 0 || min < 0 || min >= 60 || sec < 0 || sec >= 60) return null;
    return hr * 3600 + min * 60 + sec;
  }

  return null;
}

/**
 * Format seconds into a human-friendly short duration (e.g., "5m 30s").
 */
export function formatDurationShort(totalSeconds: number): string {
  const abs = Math.abs(Math.round(totalSeconds));
  const min = Math.floor(abs / 60);
  const sec = abs % 60;
  if (min === 0) return `${sec}s`;
  if (sec === 0) return `${min}m`;
  return `${min}m ${sec}s`;
}
