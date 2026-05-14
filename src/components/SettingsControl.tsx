import { useEffect, useRef, useState } from 'react';
import s from './SettingsControl.module.css';

interface Props {
  onRefreshAudio: () => void;
}

export function SettingsControl({ onRefreshAudio }: Props) {
  const [open, setOpen] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleRefresh = () => {
    onRefreshAudio();
    setRefreshed(true);
    window.setTimeout(() => setRefreshed(false), 2500);
  };

  return (
    <div className={s.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={s.gearBtn}
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div className={s.popover} role="menu">
          <button
            type="button"
            className={s.item}
            onClick={handleRefresh}
            role="menuitem"
          >
            <span className={s.itemLabel}>Refresh pronunciation audio</span>
            <span className={refreshed ? s.itemHintActive : s.itemHint}>
              {refreshed ? 'Cleared — will re-download on next play' : 'Re-fetch from current audio source'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
