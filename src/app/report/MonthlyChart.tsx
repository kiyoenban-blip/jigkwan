"use client";

import { useState } from "react";
import { niceTicks } from "@/lib/chart";
import { formatCompactWon, formatWon } from "@/lib/format";
import styles from "./report.module.css";

type Props = { monthly: { month: number; amount: number }[] };

export function MonthlyChart({ monthly }: Props) {
  const peak = monthly.reduce((best, m) => (m.amount > best.amount ? m : best), monthly[0]);
  const [selected, setSelected] = useState<number | null>(null);
  const ticks = niceTicks(peak.amount);
  const axisMax = ticks[ticks.length - 1] || 1;
  const active = selected === null ? null : monthly[selected - 1];

  return (
    <div className={styles.monthly}>
      <p className={styles.readout} aria-live="polite">
        {active ? (
          <>
            <span className="muted">{active.month}월</span> <strong>{formatWon(active.amount)}</strong>
          </>
        ) : (
          <>
            <span className="muted">가장 많이 쓴 달</span>{" "}
            <strong>
              {peak.month}월 · {formatWon(peak.amount)}
            </strong>
          </>
        )}
      </p>

      <div className={styles.plot} onPointerLeave={() => setSelected(null)}>
        <div className={styles.grid} aria-hidden>
          {ticks.map((tick) => (
            <div key={tick} className={styles.gridLine} style={{ bottom: `${(tick / axisMax) * 100}%` }}>
              <span>{formatCompactWon(tick)}</span>
            </div>
          ))}
        </div>
        <div className={styles.columns}>
          {monthly.map((m) => (
            <button
              key={m.month}
              type="button"
              className={styles.column}
              data-active={selected === m.month || undefined}
              aria-label={`${m.month}월 ${formatWon(m.amount)}`}
              onPointerEnter={() => setSelected(m.month)}
              onFocus={() => setSelected(m.month)}
              onBlur={() => setSelected(null)}
              onClick={() => setSelected(m.month)}
            >
              <span className={styles.columnTrack}>
                {m.amount > 0 && (
                  <span className={styles.columnBar} style={{ height: `${(m.amount / axisMax) * 100}%` }} />
                )}
              </span>
              <span className={styles.columnLabel}>{m.month}</span>
            </button>
          ))}
        </div>
      </div>

      <details className={styles.table}>
        <summary>표로 보기</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">월</th>
              <th scope="col">지출</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m) => (
              <tr key={m.month}>
                <td>{m.month}월</td>
                <td>{formatWon(m.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
