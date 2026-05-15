import type { Product } from "../types";


export const SEASON_SOON_ENTER_DAYS = 45;


const SEASON_MONTHS: Record<string, number[]> = {
  весна: [3, 4, 5],
  лето: [6, 7, 8],
  осень: [9, 10, 11],
  зима: [12, 1, 2],
};

export function inSeasonOnDate(seasons: string[] | undefined, d: Date): boolean {
  const sl = (seasons ?? []).map((s) => s.toLowerCase().trim());
  if (sl.includes("круглый год")) return true;
  const m = d.getMonth() + 1;
  for (const [key, months] of Object.entries(SEASON_MONTHS)) {
    if (sl.includes(key) && months.includes(m)) return true;
  }
  return false;
}


export function inSeasonCalendarMonth(
  product: Product,
  year: number,
  month0: number,
): boolean {
  const mid = new Date(year, month0, 15);
  return inSeasonOnDate(product.seasons, mid);
}


export function daysUntilNextEnterSeason(
  product: Product,
  from: Date = new Date(),
): number | null {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (inSeasonOnDate(product.seasons, today)) return null;
  for (let i = 1; i <= 370; i++) {
    const probe = new Date(today);
    probe.setDate(today.getDate() + i);
    if (inSeasonOnDate(product.seasons, probe)) return i;
  }
  return null;
}


export function percentInSeasonThisMonth(products: Product[]): number {
  if (!products.length) return 0;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let ok = 0;
  for (const p of products) {
    if (inSeasonCalendarMonth(p, y, m)) ok += 1;
  }
  return Math.round((100 * ok) / products.length);
}

function threeWayPercents(a: number, b: number, c: number): [number, number, number] {
  const t = a + b + c;
  if (t === 0) return [0, 0, 0];
  const raw = [(100 * a) / t, (100 * b) / t, (100 * c) / t];
  const floor = raw.map((x) => Math.floor(x));
  const rem = 100 - floor[0] - floor[1] - floor[2];
  const order = [0, 1, 2].sort(
    (i, j) =>
      raw[j] - Math.floor(raw[j]) - (raw[i] - Math.floor(raw[i])),
  );
  const out = [...floor] as [number, number, number];
  for (let k = 0; k < rem; k++) out[order[k]] += 1;
  return out;
}

export type SeasonNowBreakdown = {
  vegetables: number;
  fish: number;
  meat: number;
  percentVegetables: number;
  percentFish: number;
  percentMeat: number;
};


export function breakdownSeasonNowVegFishMeat(
  products: Product[],
): SeasonNowBreakdown {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let vegetables = 0;
  let fish = 0;
  let meat = 0;
  for (const p of products) {
    if (!inSeasonCalendarMonth(p, y, m)) continue;
    const c = (p.category || "").toLowerCase().trim();
    if (c === "овощи") vegetables += 1;
    else if (c === "рыба") fish += 1;
    else if (c === "мясо") meat += 1;
  }
  const [pv, pf, pm] = threeWayPercents(vegetables, fish, meat);
  return {
    vegetables,
    fish,
    meat,
    percentVegetables: pv,
    percentFish: pf,
    percentMeat: pm,
  };
}
