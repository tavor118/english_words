import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AddWordForm } from '../components/AddWordForm';
import { WordList } from '../components/WordList';
import { Flashcard } from '../components/Flashcard';
import { Quiz } from '../components/Quiz';
import { PlayButton } from '../components/PlayButton';
import { WordRow } from '../components/WordRow';
import { createWord } from './helpers';

// Mock fetch for spell check / translate / image search
globalThis.fetch = vi.fn(() =>
  Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
);

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

    expect(screen.getByText('Click to flip')).toBeInTheDocument();
    fireEvent.click(screen.getByText('hello'));

    expect(screen.getByRole('button', { name: "Don't Know" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got It!' })).toBeInTheDocument();
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
      (btn) => btn.textContent?.startsWith('t')
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
