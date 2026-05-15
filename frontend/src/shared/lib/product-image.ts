import type { Product } from "../types";

export function productImageUrl(product: Product): string | undefined {
  const u = product.image_url?.trim();
  return u || undefined;
}

export function productHasIngredientPhoto(product: Product): boolean {
  return Boolean(productImageUrl(product));
}
