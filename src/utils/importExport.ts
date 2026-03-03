import type { Presentation } from '../types';
import { formatTime, parseDuration } from './timeUtils';

interface ExportedPresentation {
  name: string;
  sections: { name: string; duration: string }[];
}

interface ImportedSection {
  name: string;
  durationSec: number;
}

export function exportPresentation(presentation: Presentation): string {
  const data: ExportedPresentation = {
    name: presentation.name,
    sections: presentation.sections.map(s => ({
      name: s.name,
      duration: formatTime(s.originalDurationSec),
    })),
  };
  return JSON.stringify(data, null, 2);
}

export function importPresentation(json: string): { name: string; sections: ImportedSection[] } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON. Please check the file format.');
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Expected a JSON object with "name" and "sections" fields.');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    throw new Error('Missing or empty "name" field.');
  }

  if (!Array.isArray(obj.sections)) {
    throw new Error('Missing "sections" array.');
  }

  const sections: ImportedSection[] = obj.sections.map((s: unknown, i: number) => {
    if (typeof s !== 'object' || s === null || Array.isArray(s)) {
      throw new Error(`Section ${i + 1}: expected an object with "name" and "duration".`);
    }
    const sec = s as Record<string, unknown>;

    if (typeof sec.name !== 'string' || !sec.name.trim()) {
      throw new Error(`Section ${i + 1}: missing or empty "name".`);
    }

    if (typeof sec.duration !== 'string') {
      throw new Error(`Section ${i + 1}: missing "duration" (expected "MM:SS" or "H:MM:SS").`);
    }

    const durationSec = parseDuration(sec.duration);
    if (durationSec === null) {
      throw new Error(`Section ${i + 1}: invalid duration "${sec.duration}". Use "MM:SS" or "H:MM:SS".`);
    }

    return { name: sec.name, durationSec };
  });

  return { name: obj.name, sections };
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function openFilePicker(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    };
    input.click();
  });
}
