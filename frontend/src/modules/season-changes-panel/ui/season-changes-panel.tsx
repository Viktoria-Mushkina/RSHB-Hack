import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import type { Product, SeasonChangeItem } from "../../../shared/types";
import layout from "../../../shared/styles/app-layout.module.css";
import styles from "./season-changes-panel.module.css";

interface SeasonChangesPanelProps {
  entering: SeasonChangeItem[];
  exiting: SeasonChangeItem[];
  dataSource: "dictionary" | "menu";
  products: Product[];
}

function nameToImageMap(products: Product[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of products) {
    const url = p.image_url?.trim();
    if (!url) continue;
    m.set(p.name.toLowerCase().trim(), url);
  }
  return m;
}
function photosForItem(
  item: SeasonChangeItem,
  lookup: Map<string, string>,
  max: number,
): string[] {
  const out: string[] = [];
  for (const raw of item.ingredients ?? []) {
    const key = raw.toLowerCase().trim();
    const u = lookup.get(key);
    if (u && !out.includes(u)) out.push(u);
    if (out.length >= max) break;
  }
  return out;
}

function ChangeList({
  items,
  lookup,
}: {
  items: SeasonChangeItem[];
  lookup: Map<string, string>;
}) {
  if (!items.length) {
    return (
      <p className={styles.empty}>Нет позиций с ближайшим изменением сезона</p>
    );
  }
  return (
    <ul className={styles.list}>
      {items.map((it, i) => {
        const photos = photosForItem(it, lookup, 4);
        return (
          <li key={`${it.dish_name}-${i}`} className={styles.item}>
            <div className={styles.thumb} aria-hidden>
              {photos.length > 0 ? (
                <div className={styles.thumbPhotos}>
                  {photos.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className={styles.thumbPhoto}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.thumbPlaceholder} />
              )}
            </div>
            <div className={styles.meta}>
              <span className={styles.name}>{it.dish_name}</span>
              <span className={styles.sub}>{it.subtitle}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SeasonChangesPanel({
  entering,
  exiting,
  dataSource,
  products,
}: SeasonChangesPanelProps) {
  const lookup = useMemo(() => nameToImageMap(products), [products]);
  const hasAny = entering.length > 0 || exiting.length > 0;
  const isMenu = dataSource === "menu";

  return (
    <section className={`${layout.panelWarm} ${styles.panelFill}`}>
      <h2 className={layout.panelTitle}>Ближайшие сезонные изменения</h2>
      {!hasAny ? (
        <p className={styles.emptyBlock}>
          {isMenu
            ? "Загрузите PDF меню — здесь появятся прогнозы по продуктам из файла."
            : "По справочнику сейчас нет позиций с ближайшим входом или выходом из сезона."}
        </p>
      ) : (
        <div className={styles.cols}>
          <div className={styles.colEnter}>
            <div className={styles.colBody}>
              {entering.length ? (
                <>
                  <p className={styles.lead}>
                    Через {entering[0].days_until}{" "}
                    {entering[0].days_until === 1
                      ? "день"
                      : entering[0].days_until < 5
                        ? "дня"
                        : "дней"}{" "}
                    начинается сезон:
                  </p>
                  <div className={styles.rule} />
                  <ChangeList items={entering} lookup={lookup} />
                </>
              ) : (
                <p className={styles.emptyCol}>
                  {isMenu
                    ? "Среди ингредиентов меню нет тех, кто скоро выходит в сезон."
                    : "Нет продуктов справочника с приближающимся началом сезона."}
                </p>
              )}
            </div>
            <NavLink
              to={isMenu ? "/calendar?source=menu" : "/calendar"}
              className={styles.colCalendarLink}
              aria-label="Открыть календарь сезонности"
            >
              <img src="/icons/arrow-icon.svg" alt="" />
            </NavLink>
          </div>
          <div className={styles.colExit}>
            <div className={styles.colBody}>
              {exiting.length ? (
                <>
                  <p className={styles.lead}>
                    Через {exiting[0].days_until}{" "}
                    {exiting[0].days_until === 1
                      ? "день"
                      : exiting[0].days_until < 5
                        ? "дня"
                        : "дней"}{" "}
                    закончивается сезон:
                  </p>
                  <div className={styles.rule} />
                  <ChangeList items={exiting} lookup={lookup} />
                </>
              ) : (
                <p className={styles.emptyCol}>
                  {isMenu
                    ? "Среди ингредиентов меню нет тех, у кого скоро заканчивается сезон."
                    : "Нет продуктов справочника с приближающимся окончанием сезона."}
                </p>
              )}
            </div>
            <NavLink
              to={isMenu ? "/calendar?source=menu" : "/calendar"}
              className={styles.colCalendarLink}
              aria-label="Открыть календарь сезонности"
            >
              <img src="/icons/arrow-icon.svg" alt="" />
            </NavLink>
          </div>
        </div>
      )}
    </section>
  );
}
