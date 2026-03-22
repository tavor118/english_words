import { useState } from 'react';
import type { View } from './types';
import { useWords } from './hooks/useWords';
import { AddWordForm } from './components/AddWordForm';
import { WordList } from './components/WordList';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { exportWords, importWords } from './utils/storage';
import './App.css';

function App() {
  const [view, setView] = useState<View>('list');
  const [prefillWord, setPrefillWord] = useState('');
  const { words, addWord, updateWord, deleteWord, replaceWords } = useWords();

  const handleImport = async (file: File) => {
    try {
      const imported = await importWords(file);
      replaceWords(imported);
    } catch {
      alert('Failed to import file. Please check the format.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>English Words</h1>
        <nav className="nav">
          <button
            className={`nav-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            Words
          </button>
          <button
            className={`nav-btn ${view === 'add' ? 'active' : ''}`}
            onClick={() => { setPrefillWord(''); setView('add'); }}
          >
            Add
          </button>
          <button
            className={`nav-btn ${view === 'flashcard' ? 'active' : ''}`}
            onClick={() => setView('flashcard')}
          >
            Flashcards
          </button>
          <button
            className={`nav-btn ${view === 'quiz' ? 'active' : ''}`}
            onClick={() => setView('quiz')}
          >
            Quiz
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'list' && (
          <WordList
            words={words}
            onDelete={deleteWord}
            onExport={() => exportWords(words)}
            onImport={handleImport}
            onNavigateToAdd={(word) => { setPrefillWord(word); setView('add'); }}
          />
        )}
        {view === 'add' && <AddWordForm key={prefillWord} words={words} initialWord={prefillWord} onAdd={(w) => { addWord(w); setPrefillWord(''); }} />}
        {view === 'flashcard' && <Flashcard key={Date.now()} words={words} onUpdate={updateWord} />}
        {view === 'quiz' && <Quiz key={Date.now()} words={words} onUpdate={updateWord} />}
      </main>
    </div>
  );
}

export default App;
