import { SeasonalityDonut } from "../../seasonality-donut";
import { dishImageSrc } from "../../../shared/lib/dish-image";
import { dishSeasonalityPercent } from "../../../shared/lib/dish-seasonality-percent";
import {
  dishSeasonalityMessage,
  resolveMenuDishIngredientSeason,
  seasonDotClassName,
} from "../../../shared/lib/ingredient-season-status";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { MenuDish } from "../../../shared/types";
import { MenuDishDetailActions } from "../../menu-dish-actions";
import {
  menuDishStatusClass,
  menuDishStatusLabel,
} from "../../menu-dishes-board/lib/constants";
import styles from "./menu-dish-detail.module.css";

export type MenuDishDetailProps = {
  dish: MenuDish;
  onClose: () => void;
  onEdit: () => void;
  onRemoveFromMenu: () => void;
  onAddToMenu: () => void;
};

function seasonColumnClass(col: string): string {
  if (col === "круглый год") return styles.seasonColYear;
  if (col === "пик сезона") return styles.seasonColPeak;
  if (col === "в сезоне") return styles.seasonColIn;
  if (col === "скоро в сезоне") return styles.seasonColSoon;
  return styles.seasonColOut;
}

export function MenuDishDetail({
  dish,
  onClose,
  onEdit,
  onRemoveFromMenu,
  onAddToMenu,
}: MenuDishDetailProps) {
  const percent = dishSeasonalityPercent(dish);
  const message = dishSeasonalityMessage(percent);
  const statusClass = menuDishStatusClass(dish.status, styles);

  return (
    <aside className={styles.detailAside} aria-label="Подробности блюда">
      <button
        type="button"
        className={styles.detailCloseBtn}
        onClick={onClose}
        aria-label="Закрыть"
      >
        <img src="/icons/close-icon.svg" alt="" />
      </button>

      <span className={[styles.statusPill, statusClass].join(" ")}>
        {menuDishStatusLabel(dish.status)}
      </span>

      <div className={styles.detailHero}>
        <div
          className={[
            styles.detailIconWrap,
            dish.image_url ? styles.detailIconWrapPhoto : "",
          ].join(" ")}
        >
          <img
            className={styles.detailIcon}
            src={dishImageSrc(dish.image_url, dish.category)}
            alt=""
          />
        </div>
        <div className={styles.detailHeroText}>
          <h2 className={styles.detailTitle}>
            {capitalizeProductName(dish.name)}
          </h2>
          <p className={styles.detailCategory}>{dish.category}</p>
        </div>
      </div>

      <section className={styles.ingredientsBlock}>
        <h3 className={styles.ingredientsTitle}>Ингредиенты</h3>
        <ul className={styles.ingredientsList}>
          {dish.ingredients.map((ing) => {
            const season = resolveMenuDishIngredientSeason(ing);
            return (
              <li key={ing.product_id} className={styles.ingredientRow}>
                <span className={styles.ingredientLeft}>
                  <span
                    className={[
                      styles.seasonDot,
                      seasonDotClassName(
                        season.variant,
                        styles.seasonDotIn,
                        styles.seasonDotSoon,
                        styles.seasonDotOut,
                      ),
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className={styles.ingredientName}>
                    {capitalizeProductName(ing.name)}
                  </span>
                </span>
                <span
                  className={[
                    styles.seasonCol,
                    seasonColumnClass(season.display),
                  ].join(" ")}
                >
                  {season.badgeText}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.scoreBlock}>
        <div className={styles.scoreDonutWrap}>
          <SeasonalityDonut percent={percent} compact />
        </div>
        <p className={styles.scoreMessage}>{message}</p>
      </section>

      <MenuDishDetailActions
        isInMenu={dish.status !== "not_in_menu"}
        onEdit={onEdit}
        onRemoveFromMenu={onRemoveFromMenu}
        onAddToMenu={onAddToMenu}
      />
    </aside>
  );
}
