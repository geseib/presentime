import { usePresentationStore } from './store/presentationStore';
import { PresentationManager } from './components/manager/PresentationManager';
import { EditorView } from './components/editor/EditorView';
import { PresenterView } from './components/presenter/PresenterView';

export default function App() {
  const mode = usePresentationStore(s => s.mode);

  switch (mode) {
    case 'manager':
      return <PresentationManager />;
    case 'editor':
      return <EditorView />;
    case 'presenter':
      return <PresenterView />;
  }
}
