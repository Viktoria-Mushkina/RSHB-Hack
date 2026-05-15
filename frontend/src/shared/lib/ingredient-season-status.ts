import { classifyIngredientLabel } from "./classify-ingredient";
import { computeSeasonBar } from "./season-bar";
import { inSeasonOnDate } from "./seasonality";
import type {
  MenuDishIngredient,
  Product,
  ProductWithFarmers,
} from "../types";


export type SeasonClassLabel = "Сезон" | "Не сезон" | "Скоро сезон";

export type SeasonBadgeVariant = "in" | "out" | "soon";


export type IngredientSeasonDisplay =
  | "круглый год"
  | "пик сезона"
  | "в сезоне"
  | "скоро в сезоне"
  | "не в сезоне";

export type ResolvedIngredientSeason = {
  classLabel: SeasonClassLabel;
  variant: SeasonBadgeVariant;
  display: IngredientSeasonDisplay;
  badgeText: IngredientSeasonDisplay;
};

const CALENDAR_SEASON_KEYS = ["весна", "лето", "осень", "зима"] as const;

export function isYearRoundOnlySeasons(seasons: string[] | undefined): boolean {
  const sl = (seasons ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (!sl.includes("круглый год")) return false;
  return !sl.some((s) =>
    (CALENDAR_SEASON_KEYS as readonly string[]).includes(s),
  );
}

function toProduct(ing: MenuDishIngredient): Product {
  return {
    id: ing.product_id,
    name: ing.name,
    category: ing.category,
    seasons: ing.seasons ?? [],
    cuisine_types: [],
    image_url: ing.image_url ?? null,
  };
}

function isPeakSeasonMonth(
  product: Product,
  year: number,
  month0: number,
): boolean {
  const bar = computeSeasonBar(product, year);
  if (!bar) return false;
  const span = bar.endM - bar.startM + 1;
  let a = Math.max(1, Math.floor(span / 3));
  let c = Math.max(1, Math.floor(span / 3));
  let b = span - a - c;
  if (b < 1) {
    b = 1;
    if (a > c) a -= 1;
    else c -= 1;
  }
  const peakStart = bar.startM + a;
  const peakEnd = bar.startM + a + b - 1;
  return month0 >= peakStart && month0 <= peakEnd;
}

export function seasonVariantFromClassLabel(
  label: SeasonClassLabel,
): SeasonBadgeVariant {
  if (label === "Сезон") return "in";
  if (label === "Скоро сезон") return "soon";
  return "out";
}


export function displayVariantForProduct(
  product: Product,
  classLabel: SeasonClassLabel,
  now = new Date(),
): SeasonBadgeVariant {
  if (inSeasonOnDate(product.seasons, now)) return "in";
  if (classLabel === "Скоро сезон") return "soon";
  return "out";
}

export function resolveClassLabel(
  product: Product,
  precomputed?: string | null,
): SeasonClassLabel {
  const l = precomputed?.trim();
  if (l === "Сезон" || l === "Не сезон" || l === "Скоро сезон") return l;
  return classifyIngredientLabel(product);
}

export function resolveIngredientSeasonDisplay(
  product: Product,
  variant: SeasonBadgeVariant,
  now = new Date(),
): IngredientSeasonDisplay {
  if (variant === "soon") return "скоро в сезоне";
  if (variant === "out") return "не в сезоне";
  if (isYearRoundOnlySeasons(product.seasons)) return "круглый год";
  const year = now.getFullYear();
  const month0 = now.getMonth();
  if (isPeakSeasonMonth(product, year, month0)) return "пик сезона";
  return "в сезоне";
}

export function resolveProductSeason(
  product: Product,
  hints?: { seasonLabel?: string | null },
  now = new Date(),
): ResolvedIngredientSeason {
  const classLabel = resolveClassLabel(product, hints?.seasonLabel);
  const variant = displayVariantForProduct(product, classLabel, now);
  const display = resolveIngredientSeasonDisplay(product, variant, now);
  return { classLabel, variant, display, badgeText: display };
}

export function resolveMenuDishIngredientSeason(
  ing: MenuDishIngredient,
  now = new Date(),
): ResolvedIngredientSeason {
  return resolveProductSeason(toProduct(ing), { seasonLabel: ing.season_label }, now);
}

export function productToMenuDishIngredient(product: Product): MenuDishIngredient {
  const { classLabel, variant } = resolveProductSeason(product);
  const season_label =
    variant === "in" && classLabel === "Скоро сезон" ? "Сезон" : classLabel;
  return {
    product_id: product.id,
    name: product.name,
    category: product.category,
    seasons: [...product.seasons],
    image_url: product.image_url ?? null,
    season_label,
    season_variant: variant,
  };
}

export function resolveSeasonBadge(
  product: Product,
  menuCard: ProductWithFarmers | null,
): { text: IngredientSeasonDisplay; variant: SeasonBadgeVariant } {
  const r = resolveProductSeason(product, {
    seasonLabel: menuCard?.season_label,
  });
  return { text: r.badgeText, variant: r.variant };
}

export function listSeasonStatusLabel(
  product: Product,
  menuCard: ProductWithFarmers | null,
): { text: IngredientSeasonDisplay; variant: SeasonBadgeVariant } {
  return resolveSeasonBadge(product, menuCard);
}

export function dishSeasonalityMessage(percent: number): string {
  if (percent > 50) {
    return "Отлично! Блюдо максимально использует сезонные продукты";
  }
  return "Добавьте больше сезонных ингредиентов — блюдо использует их недостаточно";
}

export function seasonDotClassName(
  variant: SeasonBadgeVariant,
  dotIn: string,
  dotSoon: string,
  dotOut: string,
): string {
  if (variant === "in") return dotIn;
  if (variant === "soon") return dotSoon;
  return dotOut;
}
