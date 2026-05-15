import { computeSeasonBar } from "../../../shared/lib/season-bar";
import { MONTHS_SHORT } from "../../../shared/lib/months";
import { seasonRangeLabel } from "../../../shared/lib/season-range-label";
import type { Product } from "../../../shared/types";
import { peakSeasonMonthLabel } from "../lib/peak-season-label";
import styles from "./season-list-board.module.css";

export function ListSeasonTimeline({
  product,
  year,
}: {
  product: Product;
  year: number;
}) {
  const bar = computeSeasonBar(product, year);
  const rangeLabel = seasonRangeLabel(product, year);

  if (!bar) {
    return (
      <span className={styles.listSeasonOff} title={rangeLabel}>
        —
      </span>
    );
  }

  const [fa, fb, fc] = bar.phaseFracs;
  const phaseCols = `${fa}fr ${fb}fr ${fc}fr`;
  const peakLabel = peakSeasonMonthLabel(bar);

  return (
    <div
      className={styles.listSeasonTimeline}
      aria-label={`Период сезона: ${rangeLabel}, пик: ${peakLabel}`}
    >
      <div className={styles.listSeasonRow}>
        <span className={styles.listSeasonEdge}>{MONTHS_SHORT[bar.startM]}</span>
        <div
          className={styles.listSeasonBarWrap}
          style={{ ["--phase-cols" as string]: phaseCols }}
        >
          <div className={styles.listSeasonPeakLayer} aria-hidden>
            <span className={styles.listSeasonPeakText}>{peakLabel}</span>
          </div>
          <div
            className={styles.listSeasonBar}
            style={{ gridTemplateColumns: phaseCols }}
          >
            <div className={styles.listSeasonPhaseStart} />
            <div className={styles.listSeasonPhasePeak} />
            <div className={styles.listSeasonPhaseEnd} />
          </div>
        </div>
        <span className={styles.listSeasonEdge}>{MONTHS_SHORT[bar.endM]}</span>
      </div>
    </div>
  );
}
