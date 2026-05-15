import { computeSeasonBar } from "../../../shared/lib/season-bar";
import type { SeasonBarModel } from "../../../shared/lib/season-bar";
import { calendarProductImageSrc } from "../../../shared/lib/calendar-product-image";
import { MONTHS_SHORT } from "../../../shared/lib/months";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { Product } from "../../../shared/types";
import styles from "./season-calendar-grid.module.css";

function MonthGridAndNow({ nowMonth }: { nowMonth: number }) {
  return (
    <>
      <div className={styles.monthGrid} aria-hidden>
        {MONTHS_SHORT.map((m) => (
          <div key={m} className={styles.monthGridLine} />
        ))}
      </div>
      <div
        className={styles.nowLine}
        style={{
          left: `calc(${(nowMonth + 0.5) / 12} * 100%)`,
        }}
      />
    </>
  );
}

function SeasonPhasesBar({ bar }: { bar: SeasonBarModel }) {
  return (
    <div
      className={styles.seasonBar}
      style={{
        left: `calc(${bar.startM / 12} * 100%)`,
        width: `calc(${(bar.endM - bar.startM + 1) / 12} * 100%)`,
      }}
    >
      <div className={styles.phaseCell}>
        <span className={styles.phaseLabelMuted}>Начало сезона</span>
      </div>
      <div className={styles.phaseCellPeak}>
        <span className={styles.phaseLabelPeak}>Пик сезона</span>
      </div>
      <div className={styles.phaseCell}>
        <span className={styles.phaseLabelMuted}>Конец сезона</span>
      </div>
    </div>
  );
}

export type SeasonCalendarGridProps = {
  products: Product[];
  year: number;
  nowMonth: number;
  selectedId: number | null;
  onSelectId: (id: number | null) => void;
};

export function SeasonCalendarGrid({
  products,
  year,
  nowMonth,
  selectedId,
  onSelectId,
}: SeasonCalendarGridProps) {
  return (
    <section className={styles.board} aria-label="Сетка по месяцам">
      <div className={styles.boardScroll}>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div className={styles.colProduct}>Продукт</div>
            {MONTHS_SHORT.map((m, i) => (
              <div
                key={m}
                className={`${styles.monthLabel} ${i === nowMonth ? styles.monthLabelNow : ""}`}
              >
                {m}
              </div>
            ))}
          </div>

          {products.map((p) => {
            const isSel = selectedId === p.id;
            const bar = computeSeasonBar(p, year);
            return (
              <div key={p.id} className={styles.row}>
                <button
                  type="button"
                  className={`${styles.rowProduct} ${isSel ? styles.rowSelected : ""}`}
                  onClick={() =>
                    onSelectId(selectedId === p.id ? null : p.id)
                  }
                >
                  <img
                    className={styles.rowIcon}
                    src={calendarProductImageSrc(p)}
                    alt=""
                    width={62}
                    height={62}
                  />
                  <span className={styles.rowName}>
                    {capitalizeProductName(p.name)}
                  </span>
                </button>
                <div className={styles.timelineWrap}>
                  <MonthGridAndNow nowMonth={nowMonth} />
                  {bar ? (
                    <SeasonPhasesBar bar={bar} />
                  ) : (
                    <p className={styles.seasonOff}>Вне сезона</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
