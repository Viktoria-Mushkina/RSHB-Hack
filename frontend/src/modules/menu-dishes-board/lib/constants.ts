import type { CustomSelectGroup } from "../../custom-select";

export const MENU_STATUS_FILTER_GROUPS: CustomSelectGroup[] = [
  {
    options: [
      { value: "all", label: "Все" },
      { value: "in_menu", label: "В меню" },
      { value: "needs_update", label: "Требует обновления" },
      { value: "not_in_menu", label: "Не в меню" },
    ],
  },
];

export function menuDishStatusLabel(status: string): string {
  if (status === "needs_update") return "Требует обновления";
  if (status === "not_in_menu") return "Не в меню";
  return "В меню";
}

export function menuDishStatusClass(
  status: string,
  styles: Record<string, string>,
): string {
  if (status === "needs_update") return styles.statusNeedsUpdate;
  if (status === "not_in_menu") return styles.statusNotInMenu;
  return styles.statusInMenu;
}
