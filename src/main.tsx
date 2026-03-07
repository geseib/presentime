import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.DEV) {
  import('./store/timerStore').then(({ useTimerStore }) => {
    (window as any).__timerStore = useTimerStore;
  });
  import('./store/presentationStore').then(({ usePresentationStore }) => {
    (window as any).__presentationStore = usePresentationStore;
  });
}
