import type { Product } from "../types";
import { computeSeasonBar } from "./season-bar";

const MONTHS_RU = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
] as const;


export function seasonRangeLabel(product: Product, year: number): string {
  const bar = computeSeasonBar(product, year);
  if (bar) {
    const a = MONTHS_RU[bar.startM];
    const b = MONTHS_RU[bar.endM];
    if (a === b) return a;
    return `${a}–${b}`;
  }
  const s = (product.seasons ?? []).filter(Boolean);
  if (s.length) return s.join(", ");
  return "—";
}
