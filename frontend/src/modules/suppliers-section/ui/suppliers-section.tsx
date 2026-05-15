import type { SupplierPreview } from "../../../shared/types";
import layout from "../../../shared/styles/app-layout.module.css";
import styles from "./suppliers-section.module.css";

interface SuppliersSectionProps {
  suppliers: SupplierPreview[];
  dataSource: "dictionary" | "menu";
}

const DEFAULT_STORE = "https://svoe-rodnoe.ru";

function storeHref(websiteUrl?: string | null): string {
  const s = websiteUrl?.trim();
  if (!s) return DEFAULT_STORE;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

export function SuppliersSection({
  suppliers,
  dataSource,
}: SuppliersSectionProps) {
  return (
    <section className={`${layout.panelWarm} ${styles.section}`}>
      <div className={styles.head}>
        <h2 className={layout.panelTitle}>Поставщики</h2>
        <a
          href="https://svoe-rodnoe.ru"
          type="button"
          className={styles.allBtn}
          target="_blank"
        >
          Смотреть всех
        </a>
      </div>
      <div className={styles.list}>
        {suppliers.length === 0 && (
          <p className={styles.empty}>
            {dataSource === "menu"
              ? "По ингредиентам меню не нашлось совпадений с поставщиками из Excel."
              : "В таблице поставщиков пока нет записей или данные не загрузились."}
          </p>
        )}
        {suppliers.map((s) => (
          <a
            key={s.id}
            className={styles.row}
            href={storeHref(s.website_url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.avatar} aria-hidden>
              <img src="/icons/account-icon.svg" alt="" />
            </div>
            <div className={styles.text}>
              <div className={styles.name}>{s.name}</div>
              <div className={styles.line}>
                {s.product_line}
                {s.region ? ` · ${s.region}` : ""}
              </div>
            </div>
            {s.badge ? <span className={styles.badge}>{s.badge}</span> : null}
          </a>
        ))}
      </div>
    </section>
  );
}
