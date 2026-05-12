const STORAGE_KEY = 'english-words-daily-progress';

export const DAILY_GOAL = 50;

export interface DailyProgress {
  date: string; // YYYY-MM-DD in local time
  points: number;
}

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadDailyProgress(): DailyProgress {
  const t = todayKey();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DailyProgress;
      if (parsed.date === t && typeof parsed.points === 'number') return parsed;
    } catch {
      // fall through to fresh state
    }
  }
  return { date: t, points: 0 };
}

export function saveDailyProgress(progress: DailyProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
