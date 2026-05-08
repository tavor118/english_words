# English Words

**Live:** https://tavor118.github.io/english_words/

A personal app for studying English vocabulary. Add words with translations, practice with flashcards and quizzes, and track your progress — all in the browser with no backend required.

Data is stored in **localStorage**, and the app is hosted on **GitHub Pages**.

## Table of Contents

- [Features](#features)
- [Spaced Repetition](#spaced-repetition)
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
- **Flashcards** — flip-to-reveal cards with spaced repetition scheduling
- **Quiz** — multiple-choice quiz mode (requires 4+ words)
- **Spaced repetition** — tracks correct/incorrect answers and schedules reviews
- **Import/Export** — backup and restore your word list as JSON
- **Dark mode** — follows system preference
- **Responsive** — works on desktop and mobile

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
