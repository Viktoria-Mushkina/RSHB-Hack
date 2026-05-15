import { useEffect, useMemo, useState } from "react";
import { CustomSelect } from "../../custom-select";
import type { CustomSelectGroup } from "../../custom-select";
import { SeasonalityDonut } from "../../seasonality-donut";
import { dishImageSrc } from "../../../shared/lib/dish-image";
import { dishSeasonalityPercent } from "../../../shared/lib/dish-seasonality-percent";
import {
  resolveMenuDishIngredientSeason,
  seasonDotClassName,
} from "../../../shared/lib/ingredient-season-status";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { MenuDish } from "../../../shared/types";
import { MenuDishActionsMenu } from "../../menu-dish-actions";
import {
  MENU_STATUS_FILTER_GROUPS,
  menuDishStatusClass,
  menuDishStatusLabel,
} from "../lib/constants";
import styles from "./menu-dishes-board.module.css";

export type MenuDishesBoardProps = {
  dishes: MenuDish[];
  categories: string[];
  ingredientOptions: { value: string; label: string }[];
  search: string;
  focusIngredientId?: number | null;
  selectedId: number | null;
  onSelectId: (id: number | null) => void;
  onEditDish: (id: number) => void;
  onRemoveFromMenu: (id: number) => void;
  onAddToMenu: (id: number) => void;
};

export function MenuDishesBoard({
  dishes,
  categories,
  ingredientOptions,
  search,
  focusIngredientId = null,
  selectedId,
  onSelectId,
  onEditDish,
  onRemoveFromMenu,
  onAddToMenu,
}: MenuDishesBoardProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ingredientPick, setIngredientPick] = useState("");
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);

  useEffect(() => {
    if (focusIngredientId != null && focusIngredientId > 0) {
      setIngredientIds([focusIngredientId]);
    }
  }, [focusIngredientId]);

  const categoryFilterGroups = useMemo<CustomSelectGroup[]>(
    () => [
      {
        options: [
          { value: "all", label: "Все" },
          ...categories.map((c) => ({ value: c, label: c })),
        ],
      },
    ],
    [categories],
  );

  const addIngredientFilter = (value: string) => {
    const id = Number(value);
    if (!Number.isFinite(id) || id <= 0) return;
    setIngredientIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setIngredientPick("");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((d) => {
      if (categoryFilter !== "all" && d.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (ingredientIds.length > 0) {
        const pids = new Set(d.ingredients.map((i) => i.product_id));
        const hasAny = ingredientIds.some((id) => pids.has(id));
        if (!hasAny) return false;
      }
      if (q) {
        const inName = d.name.toLowerCase().includes(q);
        const inIng = d.ingredients.some((i) =>
          i.name.toLowerCase().includes(q),
        );
        if (!inName && !inIng) return false;
      }
      return true;
    });
  }, [dishes, categoryFilter, statusFilter, ingredientIds, search]);

  const ingredientChipLabel = (id: number) =>
    ingredientOptions.find((o) => o.value === String(id))?.label ?? String(id);

  const toggleSelect = (id: number) => {
    onSelectId(selectedId === id ? null : id);
  };

  return (
    <section className={styles.board} aria-label="Блюда из меню">
      <div className={styles.boardListWrap}>
        <div className={styles.boardListHead}>
          <div className={styles.listFiltersRow}>
            <CustomSelect
              variant="light"
              fitContent
              triggerPrefix="Категории блюда"
              value={categoryFilter}
              onChange={setCategoryFilter}
              groups={categoryFilterGroups}
              aria-label="Фильтр по категории блюда"
            />
            <CustomSelect
              variant="light"
              fitContent
              triggerPrefix="Статус"
              value={statusFilter}
              onChange={setStatusFilter}
              groups={MENU_STATUS_FILTER_GROUPS}
              aria-label="Фильтр по статусу"
            />
            <div className={styles.ingredientFilterBlock}>
              <CustomSelect
                variant="light"
                fitContent
                placement="auto"
                triggerPrefix="Ингредиенты"
                value={ingredientPick || "all"}
                onChange={(v) => {
                  if (v === "all") return;
                  addIngredientFilter(v);
                }}
                groups={[
                  {
                    options: [
                      { value: "all", label: "Все" },
                      ...ingredientOptions.filter(
                        (o) => !ingredientIds.includes(Number(o.value)),
                      ),
                    ],
                  },
                ]}
                aria-label="Добавить фильтр по ингредиенту"
              />
              {ingredientIds.length > 0 ? (
                <div className={styles.ingredientChips}>
                  {ingredientIds.map((id) => (
                    <span key={id} className={styles.ingredientChip}>
                      {capitalizeProductName(ingredientChipLabel(id))}
                      <button
                        type="button"
                        aria-label="Убрать фильтр"
                        onClick={() =>
                          setIngredientIds((prev) =>
                            prev.filter((x) => x !== id),
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            Нет блюд по выбранным фильтрам. Измените фильтры или поиск.
          </p>
        ) : (
          <div
            className={`${styles.boardListTableScroll} ${styles.boardScroll}`}
          >
            <table className={styles.listTable}>
              <colgroup>
                <col className={styles.colDish} />
                <col className={styles.colIngredients} />
                <col className={styles.colScore} />
                <col className={styles.colStatus} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.listTh}>Блюдо</th>
                  <th className={styles.listTh}>Ингредиенты и сезонность</th>
                  <th className={styles.listTh}>Сезонная оценка</th>
                  <th className={styles.listTh}>Статус</th>
                  <th className={styles.listThActions} aria-label="Действия" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const isSel = selectedId === d.id;
                  return (
                    <tr
                      key={d.id}
                      tabIndex={0}
                      className={`${styles.listTr} ${isSel ? styles.listTrSelected : ""}`}
                      onClick={() => toggleSelect(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelect(d.id);
                        }
                      }}
                    >
                      <td className={styles.listTd}>
                        <div className={styles.listDishCell}>
                          <span
                            className={[
                              styles.listDishThumb,
                              d.image_url ? styles.listDishThumbPhoto : "",
                            ].join(" ")}
                          >
                            <img
                              src={dishImageSrc(d.image_url, d.category)}
                              alt=""
                            />
                          </span>
                          <span className={styles.listDishText}>
                            <span className={styles.listDishName}>
                              {capitalizeProductName(d.name)}
                            </span>
                            <span className={styles.listDishCat}>
                              {d.category}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className={styles.listTd}>
                        <div className={styles.listIngredients}>
                          {d.ingredients.map((ing) => {
                            const season = resolveMenuDishIngredientSeason(ing);
                            return (
                              <span
                                key={ing.product_id}
                                className={styles.ingredientPill}
                                title={season.badgeText}
                              >
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
                                {capitalizeProductName(ing.name)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className={`${styles.listTd} ${styles.listTdScore}`}>
                        <div className={styles.donutWrap}>
                          <SeasonalityDonut
                            percent={dishSeasonalityPercent(d)}
                            compact
                          />
                        </div>
                      </td>
                      <td className={styles.listTd}>
                        <span
                          className={[
                            styles.statusPill,
                            menuDishStatusClass(d.status, styles),
                          ].join(" ")}
                        >
                          {menuDishStatusLabel(d.status)}
                        </span>
                      </td>
                      <td
                        className={`${styles.listTd} ${styles.listTdActions}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuDishActionsMenu
                          isInMenu={d.status !== "not_in_menu"}
                          onEdit={() => onEditDish(d.id)}
                          onRemoveFromMenu={() => onRemoveFromMenu(d.id)}
                          onAddToMenu={() => onAddToMenu(d.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
