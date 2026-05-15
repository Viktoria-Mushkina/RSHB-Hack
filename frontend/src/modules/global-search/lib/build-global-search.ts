import type {
  MenuDish,
  Product,
  ProductWithFarmers,
  SupplierPreview,
} from "@/shared/types";

export type GlobalSearchGroupId =
  | "calendar"
  | "ingredients"
  | "dishes"
  | "suppliers";

export type GlobalSearchResult = {
  id: string;
  group: GlobalSearchGroupId;
  title: string;
  subtitle: string;
  to: string;
};

export const GLOBAL_SEARCH_MIN_LEN = 2;
const DEFAULT_MAX_PER_GROUP = 6;

export type GlobalSearchGroups = {
  id: GlobalSearchGroupId;
  label: string;
  items: GlobalSearchResult[];
}[];

function normQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

function textMatches(
  q: string,
  ...parts: (string | undefined | null)[]
): boolean {
  return parts.some((p) => p != null && p.toLowerCase().includes(q));
}

export function buildGlobalSearchGroups(input: {
  query: string;
  catalogProducts: Product[];
  menuProducts: Product[];
  cards: ProductWithFarmers[];
  menuDishes: MenuDish[];
  suppliers: SupplierPreview[];
  hasMenu: boolean;
  maxPerGroup?: number;
}): GlobalSearchGroups {
  const q = normQuery(input.query);
  if (q.length < GLOBAL_SEARCH_MIN_LEN) return [];

  const cap = input.maxPerGroup ?? DEFAULT_MAX_PER_GROUP;
  const calendar: GlobalSearchResult[] = [];
  const ingredients: GlobalSearchResult[] = [];
  const dishes: GlobalSearchResult[] = [];
  const supplierItems: GlobalSearchResult[] = [];

  const productsById = new Map<number, Product>();
  for (const p of input.catalogProducts) productsById.set(p.id, p);
  for (const p of input.menuProducts) productsById.set(p.id, p);

  for (const p of productsById.values()) {
    if (!textMatches(q, p.name, p.category)) continue;
    calendar.push({
      id: `cal-${p.id}`,
      group: "calendar",
      title: p.name,
      subtitle: p.category,
      to: `/calendar?productId=${p.id}`,
    });
    if (calendar.length >= cap) break;
  }

  if (input.hasMenu) {
    for (const row of input.cards) {
      if (!textMatches(q, row.product.name, row.product.category)) continue;
      ingredients.push({
        id: `home-ing-${row.product.id}`,
        group: "ingredients",
        title: row.product.name,
        subtitle: "Ингредиенты из меню",
        to: `/?productId=${row.product.id}`,
      });
      if (ingredients.length >= cap) break;
    }
  }

  const dishKeys = new Set<string>();
  for (const d of input.menuDishes) {
    const inTitle = textMatches(q, d.name, d.category);
    if (inTitle) {
      const key = `dish-${d.id}`;
      if (!dishKeys.has(key) && dishes.length < cap) {
        dishKeys.add(key);
        dishes.push({
          id: key,
          group: "dishes",
          title: d.name,
          subtitle: d.category,
          to: `/menu?dishId=${d.id}`,
        });
      }
    }
    for (const ing of d.ingredients) {
      if (!textMatches(q, ing.name)) continue;
      const key = `dish-${d.id}-ing-${ing.product_id}`;
      if (dishKeys.has(key) || dishes.length >= cap) continue;
      dishKeys.add(key);
      dishes.push({
        id: key,
        group: "dishes",
        title: ing.name,
        subtitle: `В блюде «${d.name}»`,
        to: `/menu?dishId=${d.id}`,
      });
    }
  }

  for (const s of input.suppliers) {
    if (!textMatches(q, s.name, s.product_line, s.region, s.badge)) continue;
    supplierItems.push({
      id: `sup-${s.id}`,
      group: "suppliers",
      title: s.name,
      subtitle: s.product_line || s.region || "Поставщик",
      to: "/suppliers",
    });
    if (supplierItems.length >= cap) break;
  }

  const groups: GlobalSearchGroups = [];
  if (calendar.length > 0) {
    groups.push({
      id: "calendar",
      label: "Календарь сезонности",
      items: calendar,
    });
  }
  if (ingredients.length > 0) {
    groups.push({
      id: "ingredients",
      label: "Ингредиенты из меню",
      items: ingredients,
    });
  }
  if (dishes.length > 0) {
    groups.push({ id: "dishes", label: "Блюда", items: dishes });
  }
  if (supplierItems.length > 0) {
    groups.push({
      id: "suppliers",
      label: "Поставщики",
      items: supplierItems,
    });
  }

  return groups;
}
