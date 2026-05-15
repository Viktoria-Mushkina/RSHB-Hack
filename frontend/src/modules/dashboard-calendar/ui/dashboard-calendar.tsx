import { useMemo, useState } from "react";
import type { Product } from "../../../shared/types";
import { categoryIconSrc } from "../../../shared/lib/category-icon";
import { capitalizeProductName } from "../../../shared/lib/text";
import { inSeasonCalendarMonth } from "../../../shared/lib/seasonality";
import { CustomSelect } from "../../custom-select";
import styles from "./dashboard-calendar.module.css";

function addMonths(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function formatMonthCap(d: Date): string {
  const s = d.toLocaleDateString("ru-RU", { month: "long" });
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function formatMonthShort(d: Date): string {
  const short = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];
  return short[d.getMonth()] ?? formatMonthCap(d);
}

function pickRows(
  products: Product[],
  category: string,
  maxRows: number,
): Product[] {
  const list =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);
  return list.slice(0, maxRows);
}

function monthCellCaps(
  product: Product,
  monthDate: Date,
): { on: boolean; capLeft: boolean; capRight: boolean } {
  const y = monthDate.getFullYear();
  const m0 = monthDate.getMonth();
  const on = inSeasonCalendarMonth(product, y, m0);
  if (!on) return { on: false, capLeft: false, capRight: false };
  const prev = addMonths(monthDate, -1);
  const next = addMonths(monthDate, 1);
  const capLeft = !inSeasonCalendarMonth(
    product,
    prev.getFullYear(),
    prev.getMonth(),
  );
  const capRight = !inSeasonCalendarMonth(
    product,
    next.getFullYear(),
    next.getMonth(),
  );
  return { on: true, capLeft, capRight };
}

interface DashboardCalendarProps {
  products: Product[];
  categories: string[];
  dataSource: "dictionary" | "menu";
}

const MAX_ROWS = 4;

export function DashboardCalendar({
  products,
  categories,
  dataSource,
}: DashboardCalendarProps) {
  const [anchor, setAnchor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [category, setCategory] = useState<string>("all");
  const triple = useMemo(
    () =>
      [addMonths(anchor, -1), anchor, addMonths(anchor, 1)] as [
        Date,
        Date,
        Date,
      ],
    [anchor],
  );

  const filterGroups = useMemo(
    () => [
      {
        options: [
          { value: "all", label: "Все ингредиенты" },
          ...categories.map((c) => ({ value: c, label: c })),
        ],
      },
    ],
    [categories],
  );

  const rows = useMemo(
    () => pickRows(products, category, MAX_ROWS),
    [products, category],
  );

  const todayRef = new Date();
  const todayY = todayRef.getFullYear();
  const todayM = todayRef.getMonth();

  const monthStrip = (
    <div className={styles.rowWide}>
      <div className={styles.sideSpacer} aria-hidden />
      <button
        type="button"
        className={styles.monthArrow}
        onClick={() => setAnchor((a) => addMonths(a, -1))}
        aria-label="Предыдущие месяцы"
      >
        <img
          src="/icons/bracket-icon.svg"
          alt=""
          width={10}
          height={16}
        />
      </button>
      <div className={styles.headTrack}>
        {triple.map((d) => {
          const isCurrentMonth =
            d.getFullYear() === todayY && d.getMonth() === todayM;
          return (
            <div
              key={`hm-${anchor.getTime()}-${d.getFullYear()}-${d.getMonth()}`}
              className={
                isCurrentMonth
                  ? `${styles.monthHeadCell} ${styles.monthHeadActive}`
                  : styles.monthHeadCell
              }
              data-current-month={isCurrentMonth ? "true" : undefined}
              title={formatMonthCap(d)}
            >
              {formatMonthShort(d)}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.monthArrow}
        onClick={() => setAnchor((a) => addMonths(a, 1))}
        aria-label="Следующие месяцы"
      >
        <img
          src="/icons/bracket-icon.svg"
          alt=""
          width={10}
          height={16}
          className={styles.arrowFlip}
        />
      </button>
      <div className={styles.sideSpacer} aria-hidden />
    </div>
  );

  return (
    <div className={styles.calendarRoot}>
      <section className={styles.card} aria-label="Календарь сезонности">
        <header className={styles.head}>
          <h2 className={styles.title}>Календарь сезонности</h2>
          <CustomSelect
            value={category}
            onChange={setCategory}
            groups={filterGroups}
            aria-label="Фильтр по категории"
          />
        </header>

        {products.length === 0 ? (
          <p className={styles.empty}>
            {dataSource === "menu"
              ? "Загрузите PDF меню — календарь будет построен по найденным в файле ингредиентам."
              : "Не удалось загрузить справочник продуктов."}
          </p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>Нет продуктов в выбранной категории.</p>
        ) : (
          <div className={styles.timeline}>
            <div className={styles.trackColumn}>
              <div className={styles.trackColumnInner}>{monthStrip}</div>
            </div>
            {rows.map((p) => (
                <div key={p.id} className={styles.dataRow}>
                  <div className={styles.rowLabel}>
                    <span className={styles.catIcon} aria-hidden>
                      <img
                        src={categoryIconSrc(p.category)}
                        alt=""
                        className={styles.categoryThumb}
                        loading="lazy"
                      />
                    </span>
                    <span className={styles.name}>
                      {capitalizeProductName(p.name)}
                    </span>
                  </div>
                  <div className={styles.trackColumn}>
                    <div className={styles.trackColumnInner}>
                      <div className={styles.rowWide}>
                        <div className={styles.sideSpacer} aria-hidden />
                        <div className={styles.arrowSlot} aria-hidden />
                        <div
                          className={styles.track}
                          title="Оранжевый фрагмент — месяцы в сезоне"
                        >
                          <div className={styles.trackMonthRuler} aria-hidden>
                            <span />
                            <span />
                            <span />
                          </div>
                          <div className={styles.trackInner}>
                            {triple.map((d) => {
                              const { on, capLeft, capRight } = monthCellCaps(
                                p,
                                d,
                              );
                              const y = d.getFullYear();
                              const m0 = d.getMonth();
                              return (
                                <div
                                  key={`${p.id}-${y}-${m0}`}
                                  className={[
                                    on ? styles.segOn : styles.segOff,
                                    on && capLeft ? styles.segCapL : "",
                                    on && capRight ? styles.segCapR : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <div className={styles.arrowSlot} aria-hidden />
                        <div className={styles.sideSpacer} aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
