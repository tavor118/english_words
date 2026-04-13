import { useState, useId } from 'react';
import type { View } from './types';
import { useWords } from './hooks/useWords';
import { AddWordForm } from './components/AddWordForm';
import { WordList } from './components/WordList';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { exportWords, importWords } from './utils/storage';
import s from './App.module.css';

function App() {
  const [view, setView] = useState<View>('list');
  const [prefillWord, setPrefillWord] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const stableId = useId();
  const { words, addWord, updateWord, deleteWord, replaceWords } = useWords();

  const handleImport = async (file: File) => {
    try {
      const imported = await importWords(file);
      replaceWords(imported);
    } catch {
      alert('Failed to import file. Please check the format.');
    }
  };

  const navItems: { key: View; label: string; onClick: () => void }[] = [
    { key: 'list', label: 'Words', onClick: () => setView('list') },
    { key: 'add', label: 'Add', onClick: () => { setPrefillWord(''); setView('add'); } },
    { key: 'flashcard', label: 'Flashcards', onClick: () => { setSessionKey((k) => k + 1); setView('flashcard'); } },
    { key: 'quiz', label: 'Quiz', onClick: () => { setSessionKey((k) => k + 1); setView('quiz'); } },
  ];

  return (
    <div className={s.app}>
      <header className={s.header}>
        <h1 className={s.title}>English Words</h1>
        <nav className={s.nav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? s.navBtnActive : s.navBtn}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {view === 'list' && (
          <WordList
            words={words}
            onDelete={deleteWord}
            onUpdate={updateWord}
            onExport={() => exportWords(words)}
            onImport={handleImport}
            onNavigateToAdd={(word) => { setPrefillWord(word); setView('add'); }}
          />
        )}
        {view === 'add' && <AddWordForm key={prefillWord} words={words} initialWord={prefillWord} onAdd={(w) => { addWord(w); setPrefillWord(''); }} />}
        {view === 'flashcard' && <Flashcard key={`${stableId}-fc-${sessionKey}`} words={words} onUpdate={updateWord} />}
        {view === 'quiz' && <Quiz key={`${stableId}-qz-${sessionKey}`} words={words} onUpdate={updateWord} />}
      </main>
    </div>
  );
}

export default App;
