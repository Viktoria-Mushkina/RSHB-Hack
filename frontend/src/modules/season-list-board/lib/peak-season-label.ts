import { MONTHS_SHORT } from "../../../shared/lib/months";
import type { SeasonBarModel } from "../../../shared/lib/season-bar";

export function peakSeasonMonthLabel(bar: SeasonBarModel): string {
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
  if (peakStart === peakEnd) return MONTHS_SHORT[peakStart];
  return `${MONTHS_SHORT[peakStart]}–${MONTHS_SHORT[peakEnd]}`;
}
