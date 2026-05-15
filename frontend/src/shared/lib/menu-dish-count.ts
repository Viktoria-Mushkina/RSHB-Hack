function dishWordRu(count: number): "блюдо" | "блюда" | "блюд" {
  const n = Math.abs(Math.trunc(count));
  const m100 = n % 100;
  const m10 = n % 10;
  if (m10 === 1 && m100 !== 11) return "блюдо";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "блюда";
  return "блюд";
}

export function menuDishCountLabel(count: number): string {
  return `${count} ${dishWordRu(count)}`;
}
