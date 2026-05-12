import { useCallback, useEffect, useState } from 'react';
import {
  DAILY_GOAL,
  loadDailyProgress,
  saveDailyProgress,
  todayKey,
} from '../utils/daily-progress';

export function useDailyProgress() {
  const [progress, setProgress] = useState(loadDailyProgress);

  useEffect(() => {
    saveDailyProgress(progress);
  }, [progress]);

  useEffect(() => {
    const refresh = () => {
      const t = todayKey();
      setProgress((prev) => (prev.date === t ? prev : { date: t, points: 0 }));
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const addPoint = useCallback(() => {
    setProgress((prev) => {
      const t = todayKey();
      if (prev.date !== t) return { date: t, points: 1 };
      return { date: t, points: prev.points + 1 };
    });
  }, []);

  const percentage = Math.min(100, Math.round((progress.points / DAILY_GOAL) * 100));

  return {
    points: progress.points,
    goal: DAILY_GOAL,
    percentage,
    addPoint,
  };
}
