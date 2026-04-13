# English Words

**Live:** https://tavor118.github.io/english_words/

A personal app for studying English vocabulary. Add words with translations, practice with flashcards and quizzes, and track your progress — all in the browser with no backend required.

Data is stored in **localStorage**, and the app is hosted on **GitHub Pages**.

## Features

- **Word management** — add, delete, search, and filter words by tags
- **Favorites** — mark words as favorites and filter by them
- **Auto-translate** — automatically fetches Ukrainian translation when adding a word
- **Auto-image** — searches Wikipedia for a relevant image
- **Spell check** — validates words against a dictionary with suggestions
- **Pronunciation** — play word audio from dictionary API or browser speech synthesis
- **Flashcards** — flip-to-reveal cards with spaced repetition scheduling
- **Quiz** — multiple-choice quiz mode (requires 4+ words)
- **Spaced repetition** — tracks correct/incorrect answers and schedules reviews
- **Import/Export** — backup and restore your word list as JSON
- **Dark mode** — follows system preference
- **Responsive** — works on desktop and mobile

## Tech Stack

- React 19 + TypeScript
- Vite
- CSS Modules (scoped per component)
- Vitest + React Testing Library
- localStorage for persistence
- GitHub Pages for hosting

## Project Structure

```
src/
  components/
    AddWordForm.tsx          # Form to add new words with auto-translate/image
    AddWordForm.module.css
    Flashcard.tsx            # Flashcard practice mode
    Flashcard.module.css
    Quiz.tsx                 # Multiple-choice quiz mode
    Quiz.module.css
    WordList.tsx             # Searchable/filterable word list
    WordList.module.css
    WordRow.tsx              # Individual word row in the list
    WordRow.module.css
    SearchBar.tsx            # Search input with spell check indicator
    SearchBar.module.css
    PlayButton.tsx           # Word pronunciation button
    PlayButton.module.css
  hooks/
    useWords.ts              # CRUD hook for word management
    useSpellCheck.ts         # Debounced spell check with suggestions
  styles/
    shared.module.css        # Shared styles (buttons, inputs, tags, stats)
  types/
    index.ts                 # TypeScript interfaces (Word, View, etc.)
  utils/
    spaced-repetition.ts     # Review scheduling and shuffle
    storage.ts               # localStorage + JSON import/export
    spellcheck.ts            # Dictionary API + Datamuse suggestions
    translate.ts             # MyMemory translation API
    image-search.ts          # Wikipedia image search
    pronunciation.ts         # Dictionary audio + speech synthesis
  test/
    components.test.tsx      # Component smoke + interaction tests
    spaced-repetition.test.ts
    storage.test.ts
    helpers.ts               # Test utilities (word factory)
    setup.ts                 # Test setup (jest-dom matchers)
  App.tsx                    # Main app with tab navigation
  App.module.css             # App layout styles
  index.css                  # Global styles and CSS variables
.github/
  workflows/
    deploy.yml               # GitHub Actions workflow for Pages deployment
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Deployment to GitHub Pages

The app deploys automatically on every push to `main` via GitHub Actions.

### Setup (one-time)

1. Go to your repository **Settings > Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the workflow will build and deploy

The site will be available at `https://<your-username>.github.io/english_words/`.

## Spaced Repetition

The app uses a simplified spaced repetition algorithm to prioritize words you struggle with:

- Each new word starts with an **interval of 1 day** and is immediately available for review
- **Correct answer** — the interval is multiplied by **2.5x** (1d > 2.5d > 6.25d > 15.6d > ...), capped at 365 days
- **Incorrect answer** — the interval resets to **1 day**
- Flashcard and Quiz modes prioritize words whose **next review date** has passed, sorted by most overdue first
- If no words are due for review, all words are included in the session

Each word tracks:
- `correctCount` / `incorrectCount` — lifetime answer stats
- `interval` — current spacing in days
- `nextReviewAt` — timestamp when the word becomes due again

## Data Storage

All words are stored in the browser's `localStorage` under the key `english-words`. To avoid data loss:

- Use the **Export** button to download a JSON backup
- Use the **Import** button to restore from a backup file
