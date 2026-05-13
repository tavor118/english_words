# English Words

**Live:** https://tavor118.github.io/english_words/

A personal app for studying English vocabulary. Add words with translations, drill them through six practice exercises (Quiz, Reverse Quiz, Typing, Listening, Match Pairs, Scrambled), review with spaced-repetition flashcards, and track per-word progress — all in the browser with no backend required.

Data is stored in **localStorage**, and the app is hosted on **GitHub Pages**.

## Table of Contents

- [Features](#features)
- [Learning Model](#learning-model)
  - [Practice exercises](#practice-exercises)
  - [Practice modes — Practice vs Marathon](#practice-modes--practice-vs-marathon)
  - [Flashcards (spaced repetition)](#flashcards-spaced-repetition)
  - [Daily goal](#daily-goal)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data Storage](#data-storage)
- [Google Drive Sync (optional)](#google-drive-sync-optional)
  - [One-time setup](#one-time-setup)
  - [How sync works](#how-sync-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Deployment to GitHub Pages](#deployment-to-github-pages)

## Features

- **Word management** — add, edit, delete, search, and filter words by tags
- **Favorites** — mark words as favorites and filter by them
- **Auto-translate** — automatically fetches Ukrainian translation when adding a word
- **Auto-image** — searches Wikipedia for a relevant image
- **Spell check** — validates words against a dictionary with suggestions
- **Pronunciation** — play word audio from dictionary API or browser speech synthesis. Auto-plays on Flashcards and Quiz (where the English word is shown); manual button elsewhere
- **Six practice exercises** — Quiz, Reverse Quiz, Typing, Listening, Match Pairs, Scrambled Letters. A word becomes **Learned** once it has been answered correctly in all six.
- **Practice and Marathon tabs** — drill one exercise at a time, or run a **Marathon** session that cycles through all six (up to 10 words each).
- **Flashcards** — flip-to-reveal cards with spaced-repetition scheduling, independent of the six-exercise model
- **Full keyboard support** — every exercise can be driven from the keyboard (number keys, letter typing, Enter to advance)
- **Per-word progress** — each word row shows a 6-dot progress indicator, with manual **Mark learned** / **Reset** controls
- **Daily goal** — a red progress bar at the bottom of the page tracks your daily activity (target: 50 answers/day, resets each day)
- **Import/Export** — backup and restore your word list as JSON
- **Dark mode** — follows system preference
- **Responsive** — adapts to mobile: the daily-progress bar shrinks, the Google sign-in collapses to an icon, and the practice navigation rewraps onto multiple lines so everything stays usable on narrow screens (down to ~320px wide). Safe-area insets are honored for iOS phones with a home indicator.

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

### Practice modes — Practice vs Marathon

The two practice modes are top-level tabs in the main nav.

**Practice** — pick one of the six exercises (Quiz, Reverse Quiz, Typing, Listening, Match Pairs, Scrambled) from the pill sub-nav and drill just that one until you switch. Each session pulls *every* unpassed-for-that-exercise word.

**Marathon** — one session walks through all six exercises in fixed order. For each step, the app picks up to **10 words** that haven't yet passed *that specific exercise*, so the word set is independent per step: a word can show up in Typing and Scrambled but skip Quiz if Quiz is already passed for it. When a step finishes, the next exercise starts automatically. After all six steps, you get a final recap.

Notes:
- Match Pairs is capped at **5 pairs (10 cards)** per round (matches the `1`–`5` / `6`–`9`,`0` keyboard layout), so the Match Pairs step in Marathon is 5 pairs even though the per-step cap is 10.
- Steps with too few words to run (Quiz/Reverse Quiz need ≥ 4 total words, Match Pairs needs ≥ 2) are silently skipped in Marathon.
- Daily-goal points still tick on each correct answer regardless of mode.

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

### Daily goal

A red progress bar pinned to the bottom of the page tracks how much practice you've done today.

- **1 point per correct answer** — every correct exercise submission and every Flashcard rated **Got It!** gives you 1 point. Wrong answers and **Don't Know** do not fill the bar. Match Pairs awards 1 point per correctly matched pair.
- **Goal: 50 points/day** — the bar fills as you practice and the flame ornament rides the leading edge. When you cross 50 the bar turns into a solid red glow and the flame switches to a 🎉.
- **Auto-resets at midnight (local time)** — at the start of a new day the bar goes back to `0 / 50`. Yesterday's points are not preserved; this is a daily activity tracker, not a streak counter.
- **Storage** — kept in `localStorage` under `english-words-daily-progress` as `{ date: 'YYYY-MM-DD', points: N }`. Independent of the word list and not synced via Google Drive.

## Keyboard Shortcuts

Every exercise can be played without touching the mouse.

- **Quiz / Reverse Quiz** — press `1`–`4` to pick the option with that number, then `Enter` to advance to the next word.
- **Typing / Listening** — type your answer, press `Enter` to check, press `Enter` again to advance. Listening auto-plays the audio when each word appears.
- **Match Pairs** — each card shows a number badge. Press `1`–`5` to select a card in the English column, `6`–`9` or `0` to select one in the Ukrainian column. A pair is evaluated as soon as one card from each side is selected.
- **Scrambled** — just type the letters of the word; the matching tile is placed automatically. `Backspace` removes the last placed letter. `Enter` advances after a verdict.
- **Flashcards** — the card is focusable on entry; press `Enter` or `Space` to flip. Once flipped, press `K` for **Got It!** or `D` for **Don't Know**.

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

**Storage location.** The word list lives in Drive's hidden `appDataFolder` as `words.json`. The OAuth scope is `drive.appdata` only — the app can't see anything else in your Drive, and the file does not show up in the Drive UI. Revoke access anytime from your Google account settings.

**Initial sync (per device).** The first time you sign in on a device, the hook runs an initial sync:
- If `words.json` already exists in Drive, the remote copy is downloaded and **merged** with the local list — see merge rules below. If the merge result differs from the remote copy, it is uploaded back so Drive matches.
- If it doesn't exist, the local list is uploaded and becomes the new remote copy.

The `modifiedTime` returned by Drive is stored locally so subsequent uploads can be deduplicated.

**Merge rules.** Words are matched by `id` (UUID).
- **Local-only or remote-only** → kept as-is. Local order is preserved; remote-only entries are appended at the end.
- **Same `id` on both sides** → field-level merge so no progress from either device is lost:
  - `progress` (per exercise): logical OR — if either device passed the exercise, the merged word has it passed.
  - `correctCount`, `incorrectCount`, `interval`, `nextReviewAt`: `max` of the two values.
  - `lastReviewedAt`: latest non-null timestamp.
  - `learnedAt`: earliest non-null timestamp (the first time the word was learned anywhere).
  - `favorite`: logical OR.
  - `tags`: set union.
  - `createdAt`: earlier of the two.
  - `word`, `translation`, `example`, `imageUrl`, `audioUrl`: prefer the non-empty/non-null value; if both are set, the local value wins.

**Auto-resume across reloads.** A flag (`english-words-drive-signed-in`) in `localStorage` remembers that you're signed in. On every page load the app re-attempts the initial sync silently (no popup). The sync runs **exactly once per session** — guarded by an internal ref so that updating local state from a download cannot re-trigger it. Signing out clears the flag and the cached `modifiedTime`.

**Ongoing uploads.** After the initial sync, any change to the word list is debounced for **~2 s** and then uploaded. Uploads are deduplicated by JSON comparison, so re-saving the same data is a no-op. If the access token has silently expired by the time the timer fires, the upload is skipped — the next change will retry rather than surface a fresh consent popup.

**Status states.** The sync UI surfaces one of: `disabled` (no client ID configured), `signed-out`, `syncing`, `idle`, or `error` (with the message attached).

**Conflict policy.** Last-write-wins **after the initial sync**. Once a device has merged-and-uploaded on sign-in, subsequent debounced uploads simply overwrite the remote file in full — there is no further merge per change. If two devices are both signed in and actively editing, whichever finishes uploading last wins for that round. Use **Export** before any risky operation if you want a manual backup.

**localStorage keys used by sync.**
- `english-words-drive-signed-in` — `'1'` if the user has authorized this app on this device.
- `english-words-drive-modified` — last known `modifiedTime` from Drive.

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
    Marathon.tsx             # Container that runs all six exercises in sequence
    DailyProgressBar.tsx     # Bottom-fixed daily activity tracker (50 pts/day)
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
    useDailyProgress.ts      # Daily activity points + day-rollover handling
  styles/
    shared.module.css        # Shared styles (buttons, inputs, tags, stats)
  types/
    index.ts                 # Word, ExerciseKey, View, EXERCISE_KEYS, EXERCISE_LABELS
  utils/
    spaced-repetition.ts     # Flashcard scheduling and shuffle
    exercise-progress.ts     # Mark/reset/check the six-exercise progress on a word
    daily-progress.ts        # Daily-points persistence + today/midnight handling
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
    daily-progress.test.ts     # Daily-points persistence + day-rollover reset
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
