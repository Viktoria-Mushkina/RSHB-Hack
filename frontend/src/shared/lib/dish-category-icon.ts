
export function dishCategoryIconSrc(category: string): string {
  const c = category.toLowerCase().trim();
  if (c === "супы") return "/dishes/soap-icon.svg";
  if (c === "салаты") return "/dishes/salad-icon.svg";
  if (c === "закуски") return "/dishes/snack-icon.svg";
  if (c === "десерты") return "/dishes/desert-icon.svg";
  if (c === "гарниры") return "/dishes/garnir-icon.svg";
  if (c === "основное") return "/dishes/main-icon.svg";
  if (c === "напитки") return "/dishes/snack-icon.svg";
  return "/dishes/main-icon.svg";
}
