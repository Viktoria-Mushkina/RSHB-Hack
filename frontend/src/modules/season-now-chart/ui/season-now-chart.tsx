import { useMemo } from "react";
import type { Product } from "../../../shared/types";
import { breakdownSeasonNowVegFishMeat } from "../../../shared/lib/seasonality";
import styles from "./season-now-chart.module.css";

const VB = 258;
const CX = 129;
const CY = 129;
const RO = 129;
const RI = 114;

function donutSlicePath(startRad: number, sweepRad: number): string {
  if (sweepRad <= 1e-6) return "";
  const endRad = startRad + sweepRad;
  const large = sweepRad > Math.PI ? 1 : 0;
  const xo1 = CX + RO * Math.cos(startRad);
  const yo1 = CY + RO * Math.sin(startRad);
  const xo2 = CX + RO * Math.cos(endRad);
  const yo2 = CY + RO * Math.sin(endRad);
  const xi2 = CX + RI * Math.cos(endRad);
  const yi2 = CY + RI * Math.sin(endRad);
  const xi1 = CX + RI * Math.cos(startRad);
  const yi1 = CY + RI * Math.sin(startRad);
  return `M ${xo1} ${yo1} A ${RO} ${RO} 0 ${large} 1 ${xo2} ${yo2} L ${xi2} ${yi2} A ${RI} ${RI} 0 ${large} 0 ${xi1} ${yi1} Z`;
}

interface SeasonNowChartProps {
  products: Product[];
}

export function SeasonNowChart({ products }: SeasonNowChartProps) {
  const b = useMemo(
    () => breakdownSeasonNowVegFishMeat(products),
    [products],
  );
  const total = b.vegetables + b.fish + b.meat;

  const slices = useMemo(() => {
    const full = 2 * Math.PI;
    const v = (b.percentVegetables / 100) * full;
    const f = (b.percentFish / 100) * full;
    const m = (b.percentMeat / 100) * full;
    let a = -Math.PI / 2;
    const out: { d: string; key: string; className: string }[] = [];
    if (v > 1e-6) {
      out.push({
        d: donutSlicePath(a, v),
        key: "veg",
        className: styles.sliceVeg,
      });
      a += v;
    }
    if (f > 1e-6) {
      out.push({
        d: donutSlicePath(a, f),
        key: "fish",
        className: styles.sliceFish,
      });
      a += f;
    }
    if (m > 1e-6) {
      out.push({
        d: donutSlicePath(a, m),
        key: "meat",
        className: styles.sliceMeat,
      });
    }
    return out;
  }, [b.percentVegetables, b.percentFish, b.percentMeat]);

  if (!products.length) {
    return (
      <p className={styles.empty}>Нет данных справочника продуктов.</p>
    );
  }

  if (total === 0) {
    return (
      <p className={styles.empty}>
        В текущем месяце среди категорий «овощи», «рыба» и «мясо» нет позиций в
        сезоне по справочнику.
      </p>
    );
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.chart}
        role="img"
        aria-label={`Овощи ${b.percentVegetables} процентов, рыба ${b.percentFish} процентов, мясо ${b.percentMeat} процентов`}
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VB} ${VB}`}
          aria-hidden
        >
          {slices.map((s) => (
            <path key={s.key} className={s.className} d={s.d} />
          ))}
        </svg>
        <div className={styles.center}>
          <div className={styles.pctBlock}>
            <span className={styles.pctLine}>
              <span className={styles.pctVal}>{b.percentVegetables}%</span>
              <span className={styles.pctHint}>овощи</span>
            </span>
            <span className={styles.pctLine}>
              <span className={styles.pctVal}>{b.percentFish}%</span>
              <span className={styles.pctHint}>рыба</span>
            </span>
            <span className={styles.pctLine}>
              <span className={styles.pctVal}>{b.percentMeat}%</span>
              <span className={styles.pctHint}>мясо</span>
            </span>
          </div>
        </div>
      </div>
      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <span className={styles.dotVeg} aria-hidden />
          <span>Овощи</span>
        </li>
        <li className={styles.legendItem}>
          <span className={styles.dotFish} aria-hidden />
          <span>Рыба</span>
        </li>
        <li className={styles.legendItem}>
          <span className={styles.dotMeat} aria-hidden />
          <span>Мясо</span>
        </li>
      </ul>
    </div>
  );
}
