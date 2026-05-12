import s from './DailyProgressBar.module.css';

interface Props {
  points: number;
  goal: number;
  percentage: number;
}

const ORNAMENT_SRC = `${import.meta.env.BASE_URL}progress-ornament.png`;

export function DailyProgressBar({ points, goal, percentage }: Props) {
  const reached = points >= goal;
  const insetSide = (100 - percentage) / 2;

  return (
    <div className={s.wrap} role="status" aria-label={`Daily progress: ${percentage}%`}>
      <div className={s.canvas}>
        <img className={s.layerBase} src={ORNAMENT_SRC} alt="" aria-hidden="true" />
        <img
          className={`${s.layerFill} ${reached ? s.layerFillDone : ''}`}
          src={ORNAMENT_SRC}
          alt=""
          aria-hidden="true"
          style={{ clipPath: `inset(0 ${insetSide}% 0 ${insetSide}%)` }}
        />
      </div>
      <div className={s.label}>
        <span className={s.points}>{points} / {goal}</span>
        <span className={s.sep}>·</span>
        <span className={s.pct}>{percentage}%</span>
      </div>
    </div>
  );
}
