import { dishCategoryIconSrc } from "./dish-category-icon";


export function dishImageSrc(
  imageUrl: string | null | undefined,
  category: string,
): string {
  if (imageUrl?.trim()) return imageUrl;
  return dishCategoryIconSrc(category);
}
