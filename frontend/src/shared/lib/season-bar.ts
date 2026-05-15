import type { Product } from "../types";
import { inSeasonCalendarMonth } from "./seasonality";

export type SeasonBarModel = {
  
  startM: number;
  
  endM: number;
  
  phaseFracs: [number, number, number];
};


export function computeSeasonBar(
  product: Product,
  year: number,
): SeasonBarModel | null {
  const flags = Array.from({ length: 12 }, (_, m) =>
    inSeasonCalendarMonth(product, year, m),
  );
  let best: { start: number; end: number; len: number } | null = null;
  let i = 0;
  while (i < 12) {
    if (!flags[i]) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < 12 && flags[j]) j += 1;
    const len = j - i;
    if (!best || len > best.len) best = { start: i, end: j - 1, len };
    i = j;
  }
  if (!best || best.len === 0) return null;

  const span = best.end - best.start + 1;
  let a = Math.max(1, Math.floor(span / 3));
  let c = Math.max(1, Math.floor(span / 3));
  let b = span - a - c;
  if (b < 1) {
    b = 1;
    if (a > c) a -= 1;
    else c -= 1;
  }
  const t = a + b + c;
  const phaseFracs: [number, number, number] = [a / t, b / t, c / t];

  return {
    startM: best.start,
    endM: best.end,
    phaseFracs,
  };
}
