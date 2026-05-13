import { useState, useId } from 'react';
import type { View, PracticeView } from './types';
import { EXERCISE_KEYS, EXERCISE_LABELS } from './types';
import { useWords } from './hooks/useWords';
import { useDriveSync } from './hooks/useDriveSync';
import { useDailyProgress } from './hooks/useDailyProgress';
import { AddWordForm } from './components/AddWordForm';
import { WordList } from './components/WordList';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { ReverseQuiz } from './components/ReverseQuiz';
import { Typing } from './components/Typing';
import { Listening } from './components/Listening';
import { MatchPairs } from './components/MatchPairs';
import { Scrambled } from './components/Scrambled';
import { Marathon } from './components/Marathon';
import { SyncControl } from './components/SyncControl';
import { DailyProgressBar } from './components/DailyProgressBar';
import { exportWords, importWords } from './utils/storage';
import { DEMO_WORDS } from './utils/demo-data';
import { findImage } from './utils/image-search';
import s from './App.module.css';

function App() {
  const [view, setView] = useState<View>('list');
  const [practiceView, setPracticeView] = useState<PracticeView>('quiz');
  const [prefillWord, setPrefillWord] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const stableId = useId();
  const { words, addWord, addWords, updateWord, deleteWord, replaceWords } = useWords();
  const sync = useDriveSync({ words, replaceWords });
  const daily = useDailyProgress();

  const handleImport = async (file: File) => {
    try {
      const imported = await importWords(file);
      replaceWords(imported);
    } catch {
      alert('Failed to import file. Please check the format.');
    }
  };

  const handleLoadDemo = async (): Promise<number> => {
    const withImages = await Promise.all(
      DEMO_WORDS.map(async (w) => ({ ...w, imageUrl: await findImage(w.word) }))
    );
    return addWords(withImages);
  };

  const startSession = (next: View) => {
    setSessionKey((k) => k + 1);
    setView(next);
  };

  const switchPractice = (next: PracticeView) => {
    setPracticeView(next);
    setSessionKey((k) => k + 1);
  };

  const navItems: { key: View; label: string; onClick: () => void }[] = [
    { key: 'list', label: 'Words', onClick: () => setView('list') },
    { key: 'add', label: 'Add', onClick: () => { setPrefillWord(''); setView('add'); } },
    { key: 'practice', label: 'Practice', onClick: () => startSession('practice') },
    { key: 'marathon', label: 'Marathon', onClick: () => startSession('marathon') },
    { key: 'flashcard', label: 'Flashcards', onClick: () => startSession('flashcard') },
  ];

  const renderPractice = () => {
    const key = `${stableId}-${practiceView}-${sessionKey}`;
    switch (practiceView) {
      case 'quiz':
        return <Quiz key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
      case 'reverseQuiz':
        return <ReverseQuiz key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
      case 'typing':
        return <Typing key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
      case 'listening':
        return <Listening key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
      case 'matchPairs':
        return <MatchPairs key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
      case 'scrambled':
        return <Scrambled key={key} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />;
    }
  };

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
        <SyncControl
          status={sync.status}
          error={sync.error}
          signedIn={sync.signedIn}
          configured={sync.configured}
          onSignIn={sync.signIn}
          onSignOut={sync.signOut}
        />
      </header>

      <main>
        {view === 'list' && (
          <WordList
            words={words}
            onDelete={deleteWord}
            onUpdate={updateWord}
            onExport={() => exportWords(words)}
            onImport={handleImport}
            onLoadDemo={handleLoadDemo}
            onNavigateToAdd={(word) => { setPrefillWord(word); setView('add'); }}
          />
        )}
        {view === 'add' && <AddWordForm key={prefillWord} words={words} initialWord={prefillWord} onAdd={(w) => { addWord(w); setPrefillWord(''); }} />}
        {view === 'flashcard' && <Flashcard key={`${stableId}-fc-${sessionKey}`} words={words} onUpdate={updateWord} onAnswer={daily.addPoint} />}
        {view === 'practice' && (
          <div>
            <nav className={s.subNav}>
              {EXERCISE_KEYS.map((key) => (
                <button
                  key={key}
                  className={practiceView === key ? s.subNavBtnActive : s.subNavBtn}
                  onClick={() => switchPractice(key)}
                >
                  {EXERCISE_LABELS[key]}
                </button>
              ))}
            </nav>
            {renderPractice()}
          </div>
        )}
        {view === 'marathon' && (
          <Marathon
            key={`${stableId}-marathon-${sessionKey}`}
            words={words}
            onUpdate={updateWord}
            onAnswer={daily.addPoint}
          />
        )}
      </main>
      <DailyProgressBar points={daily.points} goal={daily.goal} percentage={daily.percentage} />
    </div>
  );
}

export default App;
