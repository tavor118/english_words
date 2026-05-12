# English Words

**Live:** https://tavor118.github.io/english_words/

A personal app for studying English vocabulary. Add words with translations, drill them through six practice exercises (Quiz, Reverse Quiz, Typing, Listening, Match Pairs, Scrambled), review with spaced-repetition flashcards, and track per-word progress — all in the browser with no backend required.

Data is stored in **localStorage**, and the app is hosted on **GitHub Pages**.

## Table of Contents

- [Features](#features)
- [Learning Model](#learning-model)
  - [Practice exercises](#practice-exercises)
  - [Flashcards (spaced repetition)](#flashcards-spaced-repetition)
- [Data Storage](#data-storage)
- [Google Drive Sync (optional)](#google-drive-sync-optional)
  - [One-time setup](#one-time-setup)
  - [How sync works](#how-sync-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Deployment to GitHub Pages](#deployment-to-github-pages)

## Features

- **Word management** — add, delete, search, and filter words by tags
- **Favorites** — mark words as favorites and filter by them
- **Auto-translate** — automatically fetches Ukrainian translation when adding a word
- **Auto-image** — searches Wikipedia for a relevant image
- **Spell check** — validates words against a dictionary with suggestions
- **Pronunciation** — play word audio from dictionary API or browser speech synthesis
- **Six practice exercises** — Quiz, Reverse Quiz, Typing, Listening, Match Pairs, Scrambled Letters. A word becomes **Learned** once it has been answered correctly in all six.
- **Flashcards** — flip-to-reveal cards with spaced-repetition scheduling, independent of the six-exercise model
- **Per-word progress** — each word row shows a 6-dot progress indicator, with manual **Mark learned** / **Reset** controls
- **Import/Export** — backup and restore your word list as JSON
- **Dark mode** — follows system preference
- **Responsive** — works on desktop and mobile

## Learning Model

The app uses two complementary practice modes.

### Practice exercises

To **learn** a word, you must answer it correctly in each of these six exercises (one correct answer per exercise is enough):

- **Quiz** — see the English word, pick the Ukrainian translation (multiple choice).
- **Reverse Quiz** — see the Ukrainian translation, pick the English word (multiple choice).
- **Typing** — see the Ukrainian translation, type the English word.
- **Listening** — hear the word read aloud, type what you hear.
- **Match Pairs** — tap matching English/Ukrainian cards in a grid.
- **Scrambled** — arrange shuffled letters into the English word, given its Ukrainian translation.

Rules:
- **Passing bar** — a single correct answer marks that exercise passed for the word.
- **Wrong answer** — no penalty; the exercise stays unpassed and you can retry in the next session. Other exercises are not affected.
- **Learned** — once all six exercises are passed, the word is flagged `Learned`, badged on the word row, and excluded from those exercises by default. Use **Reset** on the row to bring it back, or **Mark learned** to flip a word straight to learned without practicing.
- Each session for an exercise only shows words where that specific exercise is not yet passed.

### Flashcards (spaced repetition)

Flashcards are a separate review mode and follow a simplified spaced-repetition schedule. They are unrelated to the six-exercise progress — learned words still appear in Flashcards.

- Each new word starts with an **interval of 1 day** and is immediately available for review.
- **Correct (Got It)** — the interval is multiplied by **2.5x** (1d → 2.5d → 6.25d → 15.6d → …), capped at 365 days.
- **Incorrect (Don't Know)** — the interval resets to **1 day**.
- Flashcard sessions prioritize words whose **next review date** has passed, sorted by most overdue first. If no words are due, all words are included.

Each word tracks:
- `correctCount` / `incorrectCount` — lifetime answer stats (updated by Flashcards and every exercise).
- `interval` / `nextReviewAt` — Flashcard scheduling fields.
- `progress` — `{ quiz, reverseQuiz, typing, listening, matchPairs, scrambled }` flags.
- `learnedAt` — timestamp set when the sixth exercise is passed.

## Data Storage

All words are stored in the browser's `localStorage` under the key `english-words`. To avoid data loss:

- Use the **Export** button to download a JSON backup
- Use the **Import** button to restore from a backup file

The loader migrates legacy entries on read: any word without `progress` or `learnedAt` is silently upgraded to the current schema, so older exports and existing localStorage state continue to work without manual fix-up.

## Google Drive Sync (optional)

The app can sync your word list to **your own Google Drive** so the same data is available on desktop and mobile. The file is stored in Drive's hidden `appDataFolder` — invisible in the user's Drive UI, only this app can read it, and the user can revoke access anytime from their Google account settings.

If `VITE_GOOGLE_CLIENT_ID` is not set, the app stays local-only and the sync UI is hidden.

### One-time setup

1. Open <https://console.cloud.google.com/> and create a project (or pick an existing one).
2. Enable the **Google Drive API**: APIs & Services > Library > Google Drive API > Enable.
3. Configure the **OAuth consent screen**:
   - User Type: **External**
   - Add the `.../auth/drive.appdata` scope
   - While in **Testing** mode, add the email addresses you want to allow under "Test users" (cap: 100). Going beyond that requires Google verification — `drive.appdata` is a sensitive scope.
4. Create credentials: APIs & Services > Credentials > **Create credentials** > **OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: add `http://localhost:5173` for dev and your GitHub Pages origin (e.g. `https://<your-username>.github.io`).
5. Copy the client ID into a `.env` file at the repo root:

   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
   ```

6. For GitHub Pages deployment, add `VITE_GOOGLE_CLIENT_ID` as a repo Variable (Settings > Secrets and variables > Actions > Variables) and reference it in the build step of `.github/workflows/deploy.yml`.

### How sync works

- On first sign-in, if the Drive file already exists it is downloaded and replaces the local list. If not, the local list is uploaded.
- Every change is debounced (~2 s) and uploaded.
- Conflict policy is last-write-wins. If you edit on two devices while offline, the most recent upload wins.

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
    Flashcard.tsx            # Flashcard practice mode (spaced repetition)
    Quiz.tsx                 # Practice exercise: EN word → pick UA translation
    ReverseQuiz.tsx          # Practice exercise: UA translation → pick EN word
    Typing.tsx               # Practice exercise: UA translation → type EN word
    Listening.tsx            # Practice exercise: audio → type EN word
    MatchPairs.tsx           # Practice exercise: tap matching EN/UA cards
    Scrambled.tsx            # Practice exercise: arrange shuffled letters
    WordList.tsx             # Searchable/filterable word list
    WordRow.tsx              # Word row with progress dots + learned controls
    SearchBar.tsx            # Search input with spell check indicator
    PlayButton.tsx           # Word pronunciation button
    SyncControl.tsx          # Google Drive sync sign-in / status UI
    *.module.css             # Scoped styles for each component
  hooks/
    useWords.ts              # CRUD hook for word management
    useSpellCheck.ts         # Debounced spell check with suggestions
    useDriveSync.ts          # Google Drive sync state machine
  styles/
    shared.module.css        # Shared styles (buttons, inputs, tags, stats)
  types/
    index.ts                 # Word, ExerciseKey, View, EXERCISE_KEYS, EXERCISE_LABELS
  utils/
    spaced-repetition.ts     # Flashcard scheduling and shuffle
    exercise-progress.ts     # Mark/reset/check the six-exercise progress on a word
    storage.ts               # localStorage + JSON import/export + schema migration
    spellcheck.ts            # Dictionary API + Datamuse suggestions
    translate.ts             # MyMemory translation API
    image-search.ts          # Wikipedia image search
    pronunciation.ts         # Dictionary audio + speech synthesis
    drive.ts                 # Google Drive appDataFolder client
  test/
    components.test.tsx        # Component smoke + interaction tests
    spaced-repetition.test.ts  # Flashcard SR scheduling
    exercise-progress.test.ts  # Six-exercise progress utility
    storage.test.ts            # localStorage round-trip + schema migration
    helpers.ts                 # Test utilities (word factory)
    setup.ts                   # Test setup (jest-dom matchers)
  App.tsx                    # Main app with top nav + Practice sub-nav
  App.module.css
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
