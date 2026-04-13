import { useState } from 'react';
import { getAudioUrl, playAudio, speakWord } from '../utils/pronunciation';
import s from './PlayButton.module.css';

interface Props {
  word: string;
  audioUrl?: string | null;
  onAudioUrlResolved?: (url: string) => void;
  size?: 'sm' | 'md';
}

export function PlayButton({ word, audioUrl, onAudioUrlResolved, size = 'sm' }: Props) {
  const [playing, setPlaying] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) return;
    setPlaying(true);

    if (audioUrl) {
      playAudio(audioUrl);
    } else {
      const url = await getAudioUrl(word);
      if (url) {
        playAudio(url);
        onAudioUrlResolved?.(url);
      } else {
        speakWord(word);
      }
    }

    setTimeout(() => setPlaying(false), 800);
  };

  return (
    <button
      className={`${s.button} ${s[size]} ${playing ? s.playing : ''}`}
      onClick={handleClick}
      title={`Pronounce "${word}"`}
      type="button"
    >
      {playing ? '\u{1F50A}' : '\u{1F509}'}
    </button>
  );
}
