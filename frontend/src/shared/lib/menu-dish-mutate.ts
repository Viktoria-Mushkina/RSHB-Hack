import { dishSeasonalityPercent } from "./dish-seasonality-percent";
import { productToMenuDishIngredient } from "./ingredient-season-status";
import type { MenuDish, MenuDishIngredient } from "../types";

export { productToMenuDishIngredient };

export function recomputeMenuDish(
  dish: MenuDish,
  ingredients: MenuDishIngredient[],
): MenuDish {
  const draft = { ...dish, ingredients };
  const seasonality_percent = dishSeasonalityPercent(draft);

  if (dish.status === "not_in_menu") {
    return { ...draft, seasonality_percent };
  }

  const status =
    ingredients.length === 0
      ? "in_menu"
      : seasonality_percent < 50
        ? "needs_update"
        : "in_menu";

  return { ...draft, seasonality_percent, status };
}

export function removeDishFromMenu(dish: MenuDish): MenuDish {
  return { ...dish, status: "not_in_menu" };
}

export function addDishToMenu(dish: MenuDish): MenuDish {
  const seasonality_percent = dishSeasonalityPercent(dish);
  const status =
    dish.ingredients.length === 0
      ? "in_menu"
      : seasonality_percent < 50
        ? "needs_update"
        : "in_menu";
  return { ...dish, status, seasonality_percent };
}
