import type { Product } from "../types";

export type ListFilterSeason =
  | "all"
  | "весна"
  | "лето"
  | "осень"
  | "зима";

export function productMatchesListSeasonFilter(
  product: Product,
  filter: ListFilterSeason,
): boolean {
  if (filter === "all") return true;
  const sl = (product.seasons ?? [])
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);
  return sl.includes(filter);
}
