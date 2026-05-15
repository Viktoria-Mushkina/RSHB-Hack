import styles from "./seasonality-donut.module.css";

interface SeasonalityDonutProps {
  percent: number;
  caption?: string;
  
  compact?: boolean;
}

const R = 42;
const C = 2 * Math.PI * R;

export function SeasonalityDonut({
  percent,
  caption = "сезонных ингредиентов",
  compact = false,
}: SeasonalityDonutProps) {
  const p = Math.min(100, Math.max(0, percent));
  const dash = (p / 100) * C;

  return (
    <div
      className={compact ? `${styles.donut} ${styles.donutCompact}` : styles.donut}
      role="img"
      aria-label={`Сезонность ${p} процентов`}
    >
      <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden>
        <circle
          className={styles.track}
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="14"
        />
        <circle
          className={styles.arc}
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="14"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value}>{p}%</span>
        {compact ? null : (
          <span className={styles.caption}>{caption}</span>
        )}
      </div>
    </div>
  );
}
