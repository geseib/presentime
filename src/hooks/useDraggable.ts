import { useRef, useState, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  position: Position;
  isDragging: boolean;
}

/**
 * Pointer-event-based drag hook.
 * Uses setPointerCapture for reliable cross-device tracking.
 * Clamps to viewport bounds. Default position: bottom-center.
 */
export function useDraggable(): UseDraggableReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // Set default position: bottom-center with 24px margin
  useEffect(() => {
    if (initialized || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (window.innerWidth - rect.width) / 2;
    const y = window.innerHeight - rect.height - 24;
    setPosition({ x, y });
    setInitialized(true);
  }, [initialized]);

  const clamp = useCallback((pos: Position): Position => {
    const el = ref.current;
    if (!el) return pos;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(pos.x, window.innerWidth - rect.width)),
      y: Math.max(0, Math.min(pos.y, window.innerHeight - rect.height)),
    };
  }, []);

  const onPointerDown = useCallback((e: PointerEvent) => {
    // Only drag on primary button, skip if target is a button
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const el = ref.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    const newPos = clamp({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
    setPosition(newPos);
  }, [isDragging, clamp]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  return { ref, position, isDragging };
}
