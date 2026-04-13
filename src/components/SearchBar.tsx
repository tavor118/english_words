import { useSpellCheck } from '../hooks/useSpellCheck';
import shared from '../styles/shared.module.css';
import s from './SearchBar.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmitEmpty: () => void;
  spell: ReturnType<typeof useSpellCheck>;
}

export function SearchBar({ value, onChange, onSubmitEmpty, spell }: Props) {
  return (
    <div className={`${shared.inputWithStatus} ${s.wrapper}`}>
      <input
        type="text"
        placeholder="Search words..."
        value={value}
        onChange={(e) => { onChange(e.target.value); spell.check(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmitEmpty();
          }
        }}
        className={`${shared.input} ${s.input}`}
      />
      {spell.checking && <span className={shared.inputStatus}>...</span>}
      {spell.valid && <span className={shared.inputStatusValid}>{'\u2713'}</span>}
      {spell.invalid && <span className={shared.inputStatusInvalid}>{'\u2717'}</span>}
    </div>
  );
}
