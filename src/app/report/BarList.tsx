import styles from "./report.module.css";

type Item = { key: string; label: string; value: number; display: string };

/** 값이 모두 텍스트로 붙는 단일 계열 가로 막대 목록 */
export function BarList({ items, label }: { items: Item[]; label: string }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className={styles.barList} aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className={styles.barItem}>
          <div className={styles.barText}>
            <span>{item.label}</span>
            <span className={styles.barValue}>{item.display}</span>
          </div>
          <div className={styles.barTrack} aria-hidden>
            {item.value > 0 && <div className={styles.bar} style={{ width: `${(item.value / max) * 100}%` }} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
