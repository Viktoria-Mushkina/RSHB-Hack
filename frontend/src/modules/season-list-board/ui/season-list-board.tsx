import { useEffect, useMemo, useState } from "react";
import { CustomSelect } from "../../custom-select";
import type { CustomSelectGroup } from "../../custom-select";
import { calendarProductImageSrc } from "../../../shared/lib/calendar-product-image";
import { farmerExternalUrl } from "../../../shared/lib/farmer-external-url";
import {
  productMatchesListSeasonFilter,
  type ListFilterSeason,
} from "../../../shared/lib/list-season-filter";
import { menuDishCountLabel } from "../../../shared/lib/menu-dish-count";
import { listSeasonStatusLabel } from "../../../shared/lib/ingredient-season-status";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { Product, ProductWithFarmers } from "../../../shared/types";
import {
  LIST_SEASON_FILTER_GROUPS,
  LIST_STATUS_FILTER_GROUPS,
  type ListFilterStatus,
} from "../lib/constants";
import { ListSeasonTimeline } from "./list-season-timeline";
import styles from "./season-list-board.module.css";

export type SeasonListBoardProps = {
  products: Product[];
  menuCardById: Map<number, ProductWithFarmers>;
  hasMenu: boolean;
  year: number;
  selectedId: number | null;
  onSelectId: (id: number | null) => void;
};

export function SeasonListBoard({
  products,
  menuCardById,
  hasMenu,
  year,
  selectedId,
  onSelectId,
}: SeasonListBoardProps) {
  const [listFilterStatus, setListFilterStatus] =
    useState<ListFilterStatus>("all");
  const [listFilterCategory, setListFilterCategory] = useState("all");
  const [listFilterSeason, setListFilterSeason] =
    useState<ListFilterSeason>("all");

  const categoryOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) {
      const c = (p.category ?? "").trim();
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const listTypeFilterGroups = useMemo<CustomSelectGroup[]>(
    () => [
      {
        options: [
          { value: "all", label: "Все" },
          ...categoryOptions.map((c) => ({ value: c, label: c })),
        ],
      },
    ],
    [categoryOptions],
  );

  const listFiltered = useMemo(() => {
    return products.filter((p) => {
      const card = menuCardById.get(p.id) ?? null;
      if (listFilterStatus !== "all") {
        const v = listSeasonStatusLabel(p, card).variant;
        if (v !== listFilterStatus) return false;
      }
      if (listFilterCategory !== "all" && p.category !== listFilterCategory) {
        return false;
      }
      if (!productMatchesListSeasonFilter(p, listFilterSeason)) return false;
      return true;
    });
  }, [
    products,
    menuCardById,
    listFilterStatus,
    listFilterCategory,
    listFilterSeason,
  ]);

  useEffect(() => {
    if (
      listFilterCategory !== "all" &&
      !categoryOptions.includes(listFilterCategory)
    ) {
      setListFilterCategory("all");
    }
  }, [categoryOptions, listFilterCategory]);

  const toggleSelect = (id: number) => {
    onSelectId(selectedId === id ? null : id);
  };

  return (
    <section className={styles.board} aria-label="Список продуктов">
      <div className={styles.boardListWrap}>
        <div className={styles.boardListHead}>
          <div
            className={styles.listFiltersRow}
            role="group"
            aria-label="Фильтры списка"
          >
            <CustomSelect
              variant="light"
              fitContent
              triggerPrefix="Статус"
              value={listFilterStatus}
              onChange={(v) => setListFilterStatus(v as ListFilterStatus)}
              groups={LIST_STATUS_FILTER_GROUPS}
              aria-label="Фильтр по статусу сезона"
            />
            <CustomSelect
              variant="light"
              fitContent
              triggerPrefix="Тип"
              value={listFilterCategory}
              onChange={setListFilterCategory}
              groups={listTypeFilterGroups}
              aria-label="Фильтр по типу продукта"
            />
            <CustomSelect
              variant="light"
              fitContent
              triggerPrefix="Сезон"
              value={listFilterSeason}
              onChange={(v) => setListFilterSeason(v as ListFilterSeason)}
              groups={LIST_SEASON_FILTER_GROUPS}
              aria-label="Фильтр по сезону"
            />
          </div>
          {listFiltered.length === 0 ? (
            <p className={styles.empty}>
              Нет продуктов по выбранным фильтрам. Измените фильтры или поиск.
            </p>
          ) : null}
        </div>
        {listFiltered.length > 0 ? (
          <div
            className={`${styles.boardListTableScroll} ${styles.boardScroll}`}
          >
            <table className={styles.listTable}>
              <colgroup>
                <col className={styles.colProduct} />
                <col className={styles.colStatus} />
                <col className={styles.colPeriod} />
                <col className={styles.colSuppliers} />
                <col className={styles.colMenu} />
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.listTh}>Продукт</th>
                  <th className={styles.listTh}>Статус сезона</th>
                  <th className={styles.listTh}>Период сезона</th>
                  <th className={styles.listTh}>Поставщики</th>
                  <th className={styles.listTh}>В меню</th>
                </tr>
              </thead>
              <tbody>
                {listFiltered.map((p) => {
                  const card = menuCardById.get(p.id) ?? null;
                  const status = listSeasonStatusLabel(p, card);
                  const farmers =
                    card?.available_farmers?.filter(Boolean) ?? [];
                  const inMenu = !hasMenu
                    ? "—"
                    : menuDishCountLabel(card?.menu_dish_count ?? 0);
                  const isSel = selectedId === p.id;
                  return (
                    <tr
                      key={p.id}
                      tabIndex={0}
                      className={`${styles.listTr} ${isSel ? styles.listTrSelected : ""}`}
                      onClick={() => toggleSelect(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelect(p.id);
                        }
                      }}
                    >
                      <td className={styles.listTd}>
                        <div className={styles.listProductCell}>
                          <span className={styles.listProductThumb}>
                            <img
                              src={calendarProductImageSrc(p)}
                              alt=""
                              width={44}
                              height={44}
                            />
                          </span>
                          <span className={styles.listProductText}>
                            <span className={styles.listProductName}>
                              {capitalizeProductName(p.name)}
                            </span>
                            <span className={styles.listProductCat}>
                              {p.category}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className={styles.listTd}>
                        <span
                          className={[
                            styles.listStatusPill,
                            status.variant === "in"
                              ? styles.listStatusIn
                              : status.variant === "soon"
                                ? styles.listStatusSoon
                                : styles.listStatusOut,
                          ].join(" ")}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className={`${styles.listTd} ${styles.listTdPeriod}`}>
                        <ListSeasonTimeline product={p} year={year} />
                      </td>
                      <td className={styles.listTd}>
                        {farmers.length === 0 ? (
                          <span className={styles.listDash}>—</span>
                        ) : (
                          <div
                            className={styles.listSuppliers}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                          >
                            {farmers.map((f) => {
                              const href = farmerExternalUrl(f);
                              const inner = (
                                <span
                                  className={styles.listSupplierIcon}
                                  aria-hidden
                                >
                                  <img
                                    src="/icons/account-icon.svg"
                                    alt=""
                                    width={16}
                                    height={16}
                                  />
                                </span>
                              );
                              return href ? (
                                <a
                                  key={f.id}
                                  className={styles.listSupplierLink}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={f.name}
                                  aria-label={`Сайт: ${f.name}`}
                                >
                                  {inner}
                                </a>
                              ) : (
                                <span
                                  key={f.id}
                                  className={styles.listSupplierStatic}
                                  title={f.name}
                                >
                                  {inner}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className={`${styles.listTd} ${styles.listTdMenu}`}>
                        {inMenu}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
