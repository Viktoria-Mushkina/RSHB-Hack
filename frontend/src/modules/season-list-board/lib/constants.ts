import type { CustomSelectGroup } from "../../custom-select";

export const LIST_STATUS_FILTER_GROUPS: CustomSelectGroup[] = [
  {
    options: [
      { value: "all", label: "Все" },
      { value: "in", label: "В сезоне" },
      { value: "soon", label: "Скоро начнётся" },
      { value: "out", label: "Не в сезоне" },
    ],
  },
];

export const LIST_SEASON_FILTER_GROUPS: CustomSelectGroup[] = [
  {
    options: [
      { value: "all", label: "Все" },
      { value: "весна", label: "Весна" },
      { value: "лето", label: "Лето" },
      { value: "осень", label: "Осень" },
      { value: "зима", label: "Зима" },
    ],
  },
];

export type ListFilterStatus = "all" | "in" | "out" | "soon";
