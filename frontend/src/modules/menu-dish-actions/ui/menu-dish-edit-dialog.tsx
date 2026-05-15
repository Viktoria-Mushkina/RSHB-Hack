import { useMemo, useState } from "react";
import { CustomSelect } from "../../custom-select";
import { productToMenuDishIngredient } from "../../../shared/lib/menu-dish-mutate";
import { capitalizeProductName } from "../../../shared/lib/text";
import type { MenuDish, MenuDishIngredient, Product } from "../../../shared/types";
import { modalOverlayStyles } from "@/shared/ui/modal-overlay";
import styles from "./menu-dish-edit-dialog.module.css";

export type MenuDishEditDialogProps = {
  dish: MenuDish;
  catalogProducts: Product[];
  onSave: (ingredients: MenuDishIngredient[]) => void;
  onClose: () => void;
};

export function MenuDishEditDialog({
  dish,
  catalogProducts,
  onSave,
  onClose,
}: MenuDishEditDialogProps) {
  const [ingredients, setIngredients] = useState<MenuDishIngredient[]>(() =>
    dish.ingredients.map((i) => ({ ...i })),
  );
  const [pick, setPick] = useState("");

  const availableOptions = useMemo(() => {
    const used = new Set(ingredients.map((i) => i.product_id));
    return catalogProducts
      .filter((p) => !used.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
      .map((p) => ({
        value: String(p.id),
        label: capitalizeProductName(p.name),
      }));
  }, [catalogProducts, ingredients]);

  const addIngredient = (value: string) => {
    const id = Number(value);
    if (!Number.isFinite(id)) return;
    const product = catalogProducts.find((p) => p.id === id);
    if (!product) return;
    setIngredients((prev) => [...prev, productToMenuDishIngredient(product)]);
    setPick("");
  };

  const removeIngredient = (productId: number) => {
    setIngredients((prev) => prev.filter((i) => i.product_id !== productId));
  };

  return (
    <div
      className={modalOverlayStyles.overlay}
      role="dialog"
      aria-modal
      aria-labelledby="menu-dish-edit-title"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="menu-dish-edit-title" className={styles.title}>
          Редактировать состав
        </h2>
        <p className={styles.subtitle}>
          {capitalizeProductName(dish.name)} · {dish.category}
        </p>

        {ingredients.length === 0 ? (
          <p className={styles.emptyHint}>Добавьте хотя бы один ингредиент.</p>
        ) : (
          <ul className={styles.ingredientsList}>
            {ingredients.map((ing) => (
              <li key={ing.product_id} className={styles.ingredientRow}>
                <span className={styles.ingredientName}>
                  {capitalizeProductName(ing.name)}
                </span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  aria-label={`Убрать ${ing.name}`}
                  onClick={() => removeIngredient(ing.product_id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {availableOptions.length > 0 ? (
          <div className={styles.addRow}>
            <CustomSelect
              variant="light"
              block
              placement="auto"
              value={pick || "all"}
              onChange={(v) => {
                if (v === "all") return;
                addIngredient(v);
              }}
              groups={[
                {
                  options: [
                    { value: "all", label: "Добавить ингредиент…" },
                    ...availableOptions,
                  ],
                },
              ]}
              aria-label="Добавить ингредиент"
            />
          </div>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={ingredients.length === 0}
            onClick={() => onSave(ingredients)}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
