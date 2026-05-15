import { useNavigate } from "react-router-dom";
import { calendarProductImageSrc } from "../../../shared/lib/calendar-product-image";
import { farmerExternalUrl } from "../../../shared/lib/farmer-external-url";
import { menuDishCountLabel } from "../../../shared/lib/menu-dish-count";
import { seasonRangeLabel } from "../../../shared/lib/season-range-label";
import {
  resolveSeasonBadge,
  type SeasonBadgeVariant,
} from "../../../shared/lib/ingredient-season-status";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { Farmer, Product, ProductWithFarmers } from "../../../shared/types";
import styles from "./season-product-detail.module.css";

function supplierStockBadge(variant: SeasonBadgeVariant): {
  text: string;
  className: string;
} {
  if (variant === "in")
    return { text: "Доступно", className: styles.supplierStockIn };
  if (variant === "soon")
    return { text: "Скоро доступно", className: styles.supplierStockSoon };
  return { text: "Недоступно", className: styles.supplierStockOut };
}

export type SeasonProductDetailProps = {
  product: Product;
  menuCard: ProductWithFarmers | null;
  year: number;
  farmers: Farmer[];
  hasMenu: boolean;
  onClose: () => void;
};

export function SeasonProductDetail({
  product,
  menuCard,
  year,
  farmers,
  hasMenu,
  onClose,
}: SeasonProductDetailProps) {
  const navigate = useNavigate();
  const badge = resolveSeasonBadge(product, menuCard);
  const range = seasonRangeLabel(product, year);
  const img = calendarProductImageSrc(product);
  const stock = supplierStockBadge(badge.variant);
  const inMenuCount = !hasMenu
    ? null
    : menuCard != null
      ? (menuCard.menu_dish_count ?? 0)
      : 0;

  return (
    <aside className={styles.detailAside} aria-label="Подробности продукта">
      <button
        type="button"
        className={styles.detailCloseBtn}
        onClick={onClose}
        aria-label="Закрыть"
      >
        <img src="/icons/close-icon.svg" alt="" />
      </button>
      <h2 className={styles.detailAsideTitle}>
        {capitalizeProductName(product.name)}
      </h2>

      <div className={styles.detailHero}>
        <div className={styles.detailPhotoWrap}>
          <img className={styles.detailPhoto} src={img} alt="" loading="lazy" />
          <span
            className={[
              styles.seasonBadgeOnPhoto,
              badge.variant === "in"
                ? styles.seasonBadgeIn
                : badge.variant === "out"
                  ? styles.seasonBadgeOut
                  : styles.seasonBadgeSoon,
            ].join(" ")}
          >
            {badge.text}
          </span>
        </div>
      </div>

      <div className={styles.detailMenuRow}>
        <span className={styles.detailMenuLabel}>Сезон</span>
        <span className={styles.detailMenuValue}>{range}</span>
      </div>

      <div className={styles.detailMenuRow}>
        <span className={styles.detailMenuLabel}>Тип продукта</span>
        <span className={styles.detailMenuValue}>{product.category}</span>
      </div>

      <div className={styles.detailMenuRow}>
        <span className={styles.detailMenuLabel}>В меню</span>
        <span className={styles.detailMenuValue}>
          {inMenuCount === null ? "—" : menuDishCountLabel(inMenuCount)}
        </span>
      </div>

      <section className={styles.suppliersBlock}>
        <div className={styles.suppliersHead}>
          <h3 className={styles.suppliersTitle}>Поставщики</h3>
          <a
            className={styles.suppliersAllLink}
            href="https://svoe-rodnoe.ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Смотреть всех
          </a>
        </div>
        {farmers.length === 0 ? (
          <p className={styles.suppliersEmpty}>
            Для этого продукта поставщики не найдены.
          </p>
        ) : (
          <ul className={styles.suppliersList}>
            {farmers.map((f) => {
              const href = farmerExternalUrl(f);
              const row = (
                <>
                  <div className={styles.supplierAvatar} aria-hidden>
                    <img src="/icons/account-icon.svg" alt="" />
                  </div>
                  <div className={styles.supplierText}>
                    <span className={styles.supplierName}>{f.name}</span>
                    {f.region ? (
                      <span className={styles.supplierMeta}>{f.region}</span>
                    ) : null}
                  </div>
                  <span className={stock.className}>{stock.text}</span>
                </>
              );
              return (
                <li key={f.id} className={styles.supplierItem}>
                  {href ? (
                    <a
                      className={styles.supplierItemLink}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Сайт поставщика: ${f.name}`}
                    >
                      {row}
                    </a>
                  ) : (
                    <div className={styles.supplierItemStatic}>{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        className={styles.dishesBtn}
        onClick={() => navigate(`/menu?ingredientId=${product.id}`)}
      >
        Посмотреть блюда
        <img
          src="/icons/bracket-icon.svg"
          alt=""
          className={styles.dishesBtnIcon}
        />
      </button>
    </aside>
  );
}
