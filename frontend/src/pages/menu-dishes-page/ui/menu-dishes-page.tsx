import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MenuDishEditDialog } from "@/modules/menu-dish-actions";
import { MenuDishDetail } from "@/modules/menu-dish-detail";
import { MenuDishesBoard } from "@/modules/menu-dishes-board";
import { PageToolbar } from "@/modules/page-toolbar";
import { useMenuData } from "@/shared/context/menu-data-context";
import layout from "@/shared/styles/app-layout.module.css";
import shell from "@/shared/styles/page-shell.module.css";

const PDF_INPUT_ID = "menu-dishes-pdf-input";

export function MenuDishesPage() {
  const [searchParams] = useSearchParams();
  const focusDishId = (() => {
    const raw = searchParams.get("dishId");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  })();
  const focusIngredientId = (() => {
    const raw = searchParams.get("ingredientId");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  })();

  const {
    menuDishes,
    menuDishCategories,
    menuIngredientOptions,
    catalogProducts,
    search,
    error,
    warn,
    updateMenuDishIngredients,
    removeMenuDishFromMenu,
    addMenuDishToMenu,
  } = useMenuData();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const hasDishesBoard = menuDishes.length > 0;

  const selectedDish = useMemo(() => {
    if (selectedId == null) return null;
    return menuDishes.find((d) => d.id === selectedId) ?? null;
  }, [menuDishes, selectedId]);

  const editingDish = useMemo(() => {
    if (editingId == null) return null;
    return menuDishes.find((d) => d.id === editingId) ?? null;
  }, [menuDishes, editingId]);

  useEffect(() => {
    if (selectedId != null && !menuDishes.some((d) => d.id === selectedId)) {
      setSelectedId(null);
    }
  }, [menuDishes, selectedId]);

  useEffect(() => {
    if (focusDishId != null && menuDishes.some((d) => d.id === focusDishId)) {
      setSelectedId(focusDishId);
    }
  }, [focusDishId, menuDishes]);

  return (
    <div className={shell.page}>
      {error ? <div className={layout.msgErr}>{error}</div> : null}
      {warn ? <div className={layout.msgWarn}>{warn}</div> : null}

      <PageToolbar
        title="Меню и ингредиенты"
        subtitle="Управляйте блюдами и оптимизируйте меню"
        pdfInputId={PDF_INPUT_ID}
        searchDisabled={!hasDishesBoard && menuDishes.length === 0}
      />

      {!hasDishesBoard ? (
        <section
          className={`${shell.panelWarm} ${shell.panelCenter}`}
          aria-label="Пустой справочник блюд"
        >
          <p className={shell.panelText}>
            Справочник блюд пуст. Загрузите PDF меню.
          </p>
        </section>
      ) : (
        <div
          className={
            selectedDish
              ? shell.contentSplit
              : `${shell.contentSplit} ${shell.contentSplitSingle}`
          }
        >
          <div className={shell.tableColumn}>
            <MenuDishesBoard
              dishes={menuDishes}
              categories={menuDishCategories}
              ingredientOptions={menuIngredientOptions}
              search={search}
              focusIngredientId={focusIngredientId}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              onEditDish={setEditingId}
              onRemoveFromMenu={removeMenuDishFromMenu}
              onAddToMenu={addMenuDishToMenu}
            />
          </div>
          {selectedDish ? (
            <MenuDishDetail
              dish={selectedDish}
              onClose={() => setSelectedId(null)}
              onEdit={() => setEditingId(selectedDish.id)}
              onRemoveFromMenu={() => removeMenuDishFromMenu(selectedDish.id)}
              onAddToMenu={() => addMenuDishToMenu(selectedDish.id)}
            />
          ) : null}
        </div>
      )}

      {editingDish ? (
        <MenuDishEditDialog
          dish={editingDish}
          catalogProducts={catalogProducts}
          onClose={() => setEditingId(null)}
          onSave={(ingredients) => {
            updateMenuDishIngredients(editingDish.id, ingredients);
            setEditingId(null);
          }}
        />
      ) : null}
    </div>
  );
}
