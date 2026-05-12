import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AddWordForm } from '../components/AddWordForm';
import { WordList } from '../components/WordList';
import { Flashcard } from '../components/Flashcard';
import { Quiz } from '../components/Quiz';
import { ReverseQuiz } from '../components/ReverseQuiz';
import { Typing } from '../components/Typing';
import { Listening } from '../components/Listening';
import { MatchPairs } from '../components/MatchPairs';
import { Scrambled } from '../components/Scrambled';
import { PlayButton } from '../components/PlayButton';
import { WordRow } from '../components/WordRow';
import { DailyProgressBar } from '../components/DailyProgressBar';
import { allPassedProgress, emptyProgress } from '../utils/exercise-progress';
import { createWord } from './helpers';

// Mock fetch for spell check / translate / image search
globalThis.fetch = vi.fn(() =>
  Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
);

// jsdom doesn't ship speech synthesis APIs — stub them so Listening can mount.
class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  constructor(text: string) {
    this.text = text;
  }
}
(globalThis as unknown as { SpeechSynthesisUtterance: typeof FakeUtterance }).SpeechSynthesisUtterance = FakeUtterance;
(globalThis as unknown as { speechSynthesis: { speak: (u: unknown) => void } }).speechSynthesis = { speak: vi.fn() };

afterEach(cleanup);

describe('AddWordForm', () => {
  it('renders form with required fields', () => {
    render(<AddWordForm words={[]} onAdd={vi.fn()} />);
    expect(screen.getByLabelText(/word/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/translation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Word' })).toBeInTheDocument();
  });

  it('calls onAdd when form is submitted with valid data', () => {
    const onAdd = vi.fn();
    render(<AddWordForm words={[]} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText(/^word/i), { target: { value: 'hello' } });
    fireEvent.change(screen.getByLabelText(/translation/i), { target: { value: 'привіт' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Word' }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ word: 'hello', translation: 'привіт' })
    );
  });

  it('shows existing word notice when word already exists', () => {
    const existing = createWord({ word: 'hello', translation: 'привіт' });
    render(<AddWordForm words={[existing]} initialWord="hello" onAdd={vi.fn()} />);
    expect(screen.getByText('Already in your vocabulary')).toBeInTheDocument();
  });

  it('does not show submit button when word already exists', () => {
    const existing = createWord({ word: 'hello', translation: 'привіт' });
    render(<AddWordForm words={[existing]} initialWord="hello" onAdd={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add Word' })).not.toBeInTheDocument();
  });
});

describe('WordList', () => {
  const defaultProps = {
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onNavigateToAdd: vi.fn(),
  };

  it('renders word count', () => {
    const words = [createWord(), createWord()];
    render(<WordList words={words} {...defaultProps} />);
    expect(screen.getByText(/my words \(2\)/i)).toBeInTheDocument();
  });

  it('shows empty state when no words', () => {
    render(<WordList words={[]} {...defaultProps} />);
    expect(screen.getByText(/no words yet/i)).toBeInTheDocument();
  });

  it('filters words by search', () => {
    const words = [
      createWord({ word: 'apple', translation: 'яблуко' }),
      createWord({ word: 'banana', translation: 'банан' }),
    ];
    render(<WordList words={words} {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'apple' } });

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.queryByText('banana')).not.toBeInTheDocument();
  });

  it('calls onExport when export button clicked', () => {
    const onExport = vi.fn();
    render(<WordList words={[createWord()]} {...defaultProps} onExport={onExport} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalled();
  });
});

describe('WordRow', () => {
  it('renders word and translation', () => {
    const word = createWord({ word: 'hello', translation: 'привіт' });
    render(<WordRow word={word} onDelete={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привіт')).toBeInTheDocument();
  });

  it('calls onDelete when delete clicked', () => {
    const word = createWord();
    const onDelete = vi.fn();
    render(<WordRow word={word} onDelete={onDelete} onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(word.id);
  });

  it('toggles favorite on click', () => {
    const word = createWord({ favorite: false });
    const onUpdate = vi.fn();
    render(<WordRow word={word} onDelete={vi.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTitle(/add to favorites/i));
    expect(onUpdate).toHaveBeenCalledWith(word.id, { favorite: true });
  });
});

describe('Flashcard', () => {
  it('shows empty state when no words', () => {
    render(<Flashcard words={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/add some words/i)).toBeInTheDocument();
  });

  it('renders first word', () => {
    const words = [createWord({ word: 'hello' }), createWord({ word: 'world' })];
    render(<Flashcard words={words} onUpdate={vi.fn()} />);
    expect(screen.getByText('Word')).toBeInTheDocument();
  });

  it('shows action buttons after flip', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    render(<Flashcard words={words} onUpdate={vi.fn()} />);

    expect(screen.getByText(/click or press enter to flip/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('hello'));

    expect(screen.getByRole('button', { name: /don't know/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /got it!/i })).toBeInTheDocument();
  });
});

describe('Quiz', () => {
  it('shows message when fewer than 4 words', () => {
    const words = [createWord(), createWord()];
    render(<Quiz words={words} onUpdate={vi.fn()} />);
    expect(screen.getByText(/at least 4 words/i)).toBeInTheDocument();
  });

  it('renders quiz with options when enough words', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `word${i}`, translation: `trans${i}` })
    );
    render(<Quiz words={words} onUpdate={vi.fn()} />);
    expect(screen.getByText(/what is the translation/i)).toBeInTheDocument();
  });

  it('shows next button after selecting an answer', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `w${i}`, translation: `t${i}` })
    );
    const onUpdate = vi.fn();
    render(<Quiz words={words} onUpdate={onUpdate} />);

    const options = screen.getAllByRole('button').filter(
      (btn) => /^\d\s*t\d$/.test(btn.textContent ?? '')
    );
    fireEvent.click(options[0]);

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalled();
  });
});

describe('PlayButton', () => {
  it('renders without crashing', () => {
    render(<PlayButton word="test" />);
    expect(screen.getByTitle(/pronounce "test"/i)).toBeInTheDocument();
  });
});

describe('Quiz keyboard', () => {
  it('selects an option when its number key is pressed', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `w${i}`, translation: `t${i}` })
    );
    const onUpdate = vi.fn();
    render(<Quiz words={words} onUpdate={onUpdate} />);

    fireEvent.keyDown(window, { key: '1' });

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalled();
  });

  it('ignores number keys after an option has been selected', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `w${i}`, translation: `t${i}` })
    );
    const onUpdate = vi.fn();
    render(<Quiz words={words} onUpdate={onUpdate} />);

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });

    // onUpdate should only have been called once — the second keypress is a no-op.
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('Quiz progress', () => {
  it('marks quiz progress passed on correct answer', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `w${i}`, translation: `t${i}` })
    );
    const onUpdate = vi.fn();
    render(<Quiz words={words} onUpdate={onUpdate} />);

    // The first word shown is one of the queue; identify by the visible English word.
    const headings = screen.getAllByText(/^w\d$/);
    const shown = headings[0].textContent ?? '';
    const idx = parseInt(shown.slice(1), 10);
    const correctTranslation = `t${idx}`;

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${correctTranslation}$`) }));

    expect(onUpdate).toHaveBeenCalledWith(
      words[idx].id,
      expect.objectContaining({ progress: expect.objectContaining({ quiz: true }) })
    );
  });

  it('skips words whose quiz exercise is already passed', () => {
    const passed = createWord({ word: 'done', translation: 'готово', progress: { ...emptyProgress(), quiz: true } });
    const others = Array.from({ length: 4 }, (_, i) =>
      createWord({ word: `w${i}`, translation: `t${i}` })
    );
    render(<Quiz words={[passed, ...others]} onUpdate={vi.fn()} />);
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });
});

describe('ReverseQuiz', () => {
  it('shows empty-state when fewer than 4 words', () => {
    render(<ReverseQuiz words={[createWord(), createWord()]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/at least 4 words/i)).toBeInTheDocument();
  });

  it('marks reverseQuiz progress passed on correct answer', () => {
    const words = Array.from({ length: 5 }, (_, i) =>
      createWord({ word: `eng${i}`, translation: `ukr${i}` })
    );
    const onUpdate = vi.fn();
    render(<ReverseQuiz words={words} onUpdate={onUpdate} />);

    const translations = screen.getAllByText(/^ukr\d$/);
    const shown = translations[0].textContent ?? '';
    const idx = parseInt(shown.slice(3), 10);
    const correctWord = `eng${idx}`;

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${correctWord}$`) }));

    expect(onUpdate).toHaveBeenCalledWith(
      words[idx].id,
      expect.objectContaining({ progress: expect.objectContaining({ reverseQuiz: true }) })
    );
  });
});

describe('Typing', () => {
  it('shows empty-state when no words', () => {
    render(<Typing words={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/add some words/i)).toBeInTheDocument();
  });

  it('marks typing progress passed on correct answer', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onUpdate = vi.fn();
    render(<Typing words={[word]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByPlaceholderText(/type here/i), {
      target: { value: 'apple' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ typing: true }) })
    );
  });

  it('treats trim/case differences as correct', () => {
    const word = createWord({ word: 'Apple', translation: 'яблуко' });
    const onUpdate = vi.fn();
    render(<Typing words={[word]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByPlaceholderText(/type here/i), {
      target: { value: '  apple  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ typing: true }) })
    );
  });

  it('does not mark passed on incorrect answer', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onUpdate = vi.fn();
    render(<Typing words={[word]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByPlaceholderText(/type here/i), {
      target: { value: 'banana' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    const update = onUpdate.mock.calls[0][1];
    expect(update.progress?.typing ?? false).toBe(false);
  });
});

describe('Listening', () => {
  it('shows empty-state when no words', () => {
    render(<Listening words={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/add some words/i)).toBeInTheDocument();
  });

  it('marks listening progress passed on correct answer', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onUpdate = vi.fn();
    render(<Listening words={[word]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByPlaceholderText(/type what you hear/i), {
      target: { value: 'apple' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ listening: true }) })
    );
  });
});

describe('MatchPairs', () => {
  it('shows empty-state when fewer than 2 words', () => {
    render(<MatchPairs words={[createWord()]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/at least 2 words/i)).toBeInTheDocument();
  });

  it('marks matchPairs progress passed when an EN/UA pair is selected', () => {
    const words = [
      createWord({ word: 'apple', translation: 'яблуко' }),
      createWord({ word: 'banana', translation: 'банан' }),
    ];
    const onUpdate = vi.fn();
    render(<MatchPairs words={words} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /apple$/ }));
    fireEvent.click(screen.getByRole('button', { name: /яблуко$/ }));

    expect(onUpdate).toHaveBeenCalledWith(
      words[0].id,
      expect.objectContaining({ progress: expect.objectContaining({ matchPairs: true }) })
    );
  });

  it('accepts keyboard shortcuts for both columns', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onUpdate = vi.fn();
    render(<MatchPairs words={[word]} onUpdate={onUpdate} />);

    // With a single word, the EN column has one card at "1" and the UA column has one at "6".
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '6' });

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ matchPairs: true }) })
    );
  });
});

describe('Scrambled', () => {
  it('shows empty-state when no words', () => {
    render(<Scrambled words={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/add some words/i)).toBeInTheDocument();
  });

  it('marks scrambled progress passed when all letters are placed correctly', () => {
    const word = createWord({ word: 'ab', translation: 'аб' });
    const onUpdate = vi.fn();
    render(<Scrambled words={[word]} onUpdate={onUpdate} />);

    // Two tiles labelled "a" and "b". Click in the correct order regardless of layout.
    fireEvent.click(screen.getByRole('button', { name: 'a' }));
    fireEvent.click(screen.getByRole('button', { name: 'b' }));

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ scrambled: true }) })
    );
  });

  it('accepts letters typed on the keyboard', () => {
    const word = createWord({ word: 'ab', translation: 'аб' });
    const onUpdate = vi.fn();
    render(<Scrambled words={[word]} onUpdate={onUpdate} />);

    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'b' });

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: expect.objectContaining({ scrambled: true }) })
    );
  });
});

describe('Flashcard keyboard', () => {
  it('flips the card on Enter', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    render(<Flashcard words={words} onUpdate={vi.fn()} />);

    const card = screen.getByRole('button', { name: /flip card to translation/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(screen.getByRole('button', { name: /got it!/i })).toBeInTheDocument();
  });

  it('marks Got It on K when flipped', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    const onUpdate = vi.fn();
    render(<Flashcard words={words} onUpdate={onUpdate} />);

    const card = screen.getByRole('button', { name: /flip card to translation/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'k' });

    expect(onUpdate).toHaveBeenCalled();
    const [, update] = onUpdate.mock.calls[0];
    expect(update.correctCount).toBe(1);
  });

  it('marks Don\'t Know on D when flipped', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    const onUpdate = vi.fn();
    render(<Flashcard words={words} onUpdate={onUpdate} />);

    const card = screen.getByRole('button', { name: /flip card to translation/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'd' });

    expect(onUpdate).toHaveBeenCalled();
    const [, update] = onUpdate.mock.calls[0];
    expect(update.incorrectCount).toBe(1);
  });
});

describe('DailyProgressBar', () => {
  it('renders points, goal, and percentage', () => {
    render(<DailyProgressBar points={20} goal={50} percentage={40} />);
    expect(screen.getByText('20 / 50')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('clamps width to 100% at or above the goal', () => {
    render(<DailyProgressBar points={60} goal={50} percentage={100} />);
    expect(screen.getByText('60 / 50')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('exercise points', () => {
  it('Typing calls onAnswer on a correct submission', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onAnswer = vi.fn();
    render(<Typing words={[word]} onUpdate={vi.fn()} onAnswer={onAnswer} />);

    fireEvent.change(screen.getByPlaceholderText(/type here/i), {
      target: { value: 'apple' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('Typing does NOT call onAnswer on an incorrect submission', () => {
    const word = createWord({ word: 'apple', translation: 'яблуко' });
    const onAnswer = vi.fn();
    render(<Typing words={[word]} onUpdate={vi.fn()} onAnswer={onAnswer} />);

    fireEvent.change(screen.getByPlaceholderText(/type here/i), {
      target: { value: 'banana' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('Flashcard calls onAnswer when Got It is pressed', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    const onAnswer = vi.fn();
    render(<Flashcard words={words} onUpdate={vi.fn()} onAnswer={onAnswer} />);

    const card = screen.getByRole('button', { name: /flip card to translation/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'k' });

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('Flashcard does NOT call onAnswer when Don\'t Know is pressed', () => {
    const words = [createWord({ word: 'hello', translation: 'привіт' })];
    const onAnswer = vi.fn();
    render(<Flashcard words={words} onUpdate={vi.fn()} onAnswer={onAnswer} />);

    const card = screen.getByRole('button', { name: /flip card to translation/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'd' });

    expect(onAnswer).not.toHaveBeenCalled();
  });
});

describe('WordRow learned state', () => {
  it('renders a "Mark learned" button when the word is not yet learned', () => {
    const word = createWord();
    render(<WordRow word={word} onDelete={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /mark learned/i })).toBeInTheDocument();
  });

  it('renders a "Reset" button and a Learned badge when all exercises are passed', () => {
    const word = createWord({ progress: allPassedProgress(), learnedAt: Date.now() });
    render(<WordRow word={word} onDelete={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText(/learned/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('calls onUpdate with reset payload when Reset is clicked on a learned word', () => {
    const word = createWord({ progress: allPassedProgress(), learnedAt: Date.now() });
    const onUpdate = vi.fn();
    render(<WordRow word={word} onDelete={vi.fn()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      word.id,
      expect.objectContaining({ progress: emptyProgress(), learnedAt: null })
    );
  });
});
