import { inSeasonOnDate } from "./seasonality";
import type { MenuDish, MenuDishIngredient } from "../types";


export function ingredientCountsForSeasonScore(
  ing: MenuDishIngredient,
): boolean {
  return inSeasonOnDate(ing.seasons, new Date());
}


export function dishSeasonalityPercent(dish: MenuDish): number {
  const ings = dish.ingredients;
  if (!ings.length) return 0;
  const ok = ings.filter(ingredientCountsForSeasonScore).length;
  return Math.round((100 * ok) / ings.length);
}
