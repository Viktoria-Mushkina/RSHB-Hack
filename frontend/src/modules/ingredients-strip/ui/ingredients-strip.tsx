import { useMemo, useState } from "react";
import type { ProductWithFarmers } from "../../../shared/types";
import {
  productHasIngredientPhoto,
  productImageUrl,
} from "../../../shared/lib/product-image";
import {
  resolveProductSeason,
  type SeasonBadgeVariant,
} from "../../../shared/lib/ingredient-season-status";
import { capitalizeProductName } from "../../../shared/lib/text";
import { CustomSelect } from "../../custom-select";
import layout from "@/shared/styles/app-layout.module.css";
import { modalOverlayStyles } from "@/shared/ui/modal-overlay";
import styles from "./ingredients-strip.module.css";

type FilterKey = "all" | "season" | "off" | "soon" | `cat:${string}`;

function badgeClass(variant: SeasonBadgeVariant): string {
  if (variant === "in") return styles.badgeOk;
  if (variant === "out") return styles.badgeMuted;
  return styles.badgeSoon;
}

interface IngredientsStripProps {
  items: ProductWithFarmers[];
  categories: string[];
  highlightProductId?: number | null;
}

export function IngredientsStrip({
  items,
  categories,
  highlightProductId = null,
}: IngredientsStripProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [dishOpen, setDishOpen] = useState<string[] | null>(null);

  const filterGroups = useMemo(
    () => [
      {
        label: "По сезону",
        options: [
          { value: "all", label: "Все ингредиенты" },
          { value: "season", label: "В сезоне" },
          { value: "off", label: "Не в сезоне" },
          { value: "soon", label: "Скоро в сезоне" },
        ],
      },
      {
        label: "По категории",
        options: categories.map((c) => ({
          value: `cat:${c}`,
          label: c,
        })),
      },
    ],
    [categories],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter.startsWith("cat:")) {
      const c = filter.slice(4);
      return items.filter((row) => row.product.category === c);
    }
    return items.filter((row) => {
      const { variant } = resolveProductSeason(row.product, {
        seasonLabel: row.season_label,
      });
      if (filter === "season") return variant === "in";
      if (filter === "off") return variant === "out";
      if (filter === "soon") return variant === "soon";
      return true;
    });
  }, [items, filter]);

  return (
    <>
      <section className={`${layout.panelDark} ${styles.panel}`}>
        <div className={styles.head}>
          <h2 className={`${layout.panelTitle} ${layout.panelTitleOnDark}`}>
            Ингредиенты из меню
          </h2>
          <CustomSelect
            value={filter}
            onChange={(v) => setFilter(v as FilterKey)}
            groups={filterGroups}
            aria-label="Фильтр ингредиентов"
          />
        </div>
        <div className={styles.strip}>
          {filtered.length === 0 ? (
            <p className={styles.placeholder}>
              Загрузите меню — здесь появятся карточки ингредиентов с пометкой
              сезона.
            </p>
          ) : null}
          {filtered.map((row) => {
            const season = resolveProductSeason(row.product, {
              seasonLabel: row.season_label,
            });
            return (
            <article
              key={row.product.id}
              id={`ingredient-card-${row.product.id}`}
              className={`${styles.card} ${highlightProductId === row.product.id ? styles.cardHighlight : ""}`}
            >
              <span className={badgeClass(season.variant)}>
                {season.badgeText}
              </span>
              <div className={styles.visual} aria-hidden>
                {productHasIngredientPhoto(row.product) ? (
                  <img
                    className={styles.ingredientPhoto}
                    src={productImageUrl(row.product)}
                    alt=""
                  />
                ) : (
                  <span className={styles.emoji}>
                    {row.product.category === "овощи"
                      ? "🥬"
                      : row.product.category === "мясо"
                        ? "🥩"
                        : row.product.category === "рыба"
                          ? "🐟"
                          : row.product.category === "ягоды"
                            ? "🍓"
                            : "🍽️"}
                  </span>
                )}
              </div>
              <h3 className={styles.cardName}>
                {capitalizeProductName(row.product.name)}
              </h3>
              <p className={styles.hint}>{row.season_hint ?? ""}</p>
              <button
                type="button"
                className={styles.btn}
                onClick={() =>
                  setDishOpen(
                    row.related_dishes?.length ? row.related_dishes : [],
                  )
                }
              >
                Предложения по блюдам
              </button>
            </article>
            );
          })}
        </div>
      </section>

      {dishOpen !== null && (
        <div
          className={modalOverlayStyles.overlay}
          role="dialog"
          aria-modal
          aria-labelledby="dish-modal-title"
          onClick={() => setDishOpen(null)}
        >
          <div
            className={styles.dishModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dish-modal-title">Блюда из справочника</h2>
            {dishOpen.length === 0 ? (
              <p className={styles.dishEmpty}>
                Для этого ингредиента пока нет блюд.
              </p>
            ) : (
              <ul className={styles.dishList}>
                {dishOpen.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setDishOpen(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
