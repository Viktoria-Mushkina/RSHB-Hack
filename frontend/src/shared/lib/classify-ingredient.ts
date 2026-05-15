import type { Product } from "../types";
import { inSeasonOnDate } from "./seasonality";

const SOON_DAYS = 45;

function daysUntilNextEnter(product: Product, from: Date): number | null {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (inSeasonOnDate(product.seasons, today)) return null;
  for (let i = 1; i <= 370; i++) {
    const probe = new Date(today);
    probe.setDate(today.getDate() + i);
    if (inSeasonOnDate(product.seasons, probe)) return i;
  }
  return null;
}

function daysUntilNextExit(product: Product, from: Date): number | null {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (!inSeasonOnDate(product.seasons, today)) return null;
  for (let i = 1; i <= 370; i++) {
    const probe = new Date(today);
    probe.setDate(today.getDate() + i);
    if (!inSeasonOnDate(product.seasons, probe)) return i;
  }
  return null;
}


export function classifyIngredientLabel(
  product: Product,
  today: Date = new Date(),
): "Сезон" | "Не сезон" | "Скоро сезон" {
  const inside = inSeasonOnDate(product.seasons, today);
  const dEnter = daysUntilNextEnter(product, today);
  const dExit = daysUntilNextExit(product, today);

  const soonIn = dEnter !== null && dEnter > 0 && dEnter <= SOON_DAYS;
  const soonOut = dExit !== null && dExit > 0 && dExit <= SOON_DAYS;

  if (inside) {
    if (soonOut) return "Скоро сезон";
    return "Сезон";
  }
  if (soonIn) return "Скоро сезон";
  return "Не сезон";
}
