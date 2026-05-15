import type { Product } from "../types";
import { categoryIconSrc } from "./category-icon";
import { productImageUrl } from "./product-image";


export function calendarProductImageSrc(product: Product): string {
  return productImageUrl(product) ?? categoryIconSrc(product.category);
}
