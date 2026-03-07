import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PopoutPortalProps {
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
  height?: number;
}

export function PopoutPortal({
  children,
  onClose,
  width = 500,
  height = 140,
}: PopoutPortalProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const popupRef = useRef<Window | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const popup = window.open(
      '',
      'presentime-mini',
      `width=${width},height=${height},popup=yes,resizable=yes`
    );

    if (!popup) {
      onCloseRef.current();
      return;
    }

    popupRef.current = popup;
    popup.document.title = 'Presentime';

    // Copy all stylesheets from main window to popup
    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      popup.document.head.appendChild(el.cloneNode(true));
    });

    // Reset popup body
    const body = popup.document.body;
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    body.style.background = '#0a0a0f';

    // Mount point
    const div = popup.document.createElement('div');
    div.style.width = '100vw';
    div.style.height = '100vh';
    body.appendChild(div);
    setContainer(div);

    // Forward keyboard events from popup to main window
    const forwardKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowRight', 'KeyM', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      window.dispatchEvent(new KeyboardEvent('keydown', {
        code: e.code,
        key: e.key,
        bubbles: true,
      }));
    };
    popup.addEventListener('keydown', forwardKey);

    // Detect popup closed by user
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        onCloseRef.current();
      }
    }, 300);

    return () => {
      clearInterval(checkClosed);
      popup.removeEventListener('keydown', forwardKey);
      if (!popup.closed) popup.close();
    };
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
