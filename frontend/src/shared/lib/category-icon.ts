
export function categoryIconSrc(category: string): string {
  const c = category.toLowerCase().trim();
  if (c === "мясо") return "/icons/meat-icon.svg";
  if (c === "рыба") return "/icons/fish-icon.svg";
  if (c === "грибы") return "/icons/mashrooms-icon.svg";
  return "/icons/vegetables-icon.svg";
}
