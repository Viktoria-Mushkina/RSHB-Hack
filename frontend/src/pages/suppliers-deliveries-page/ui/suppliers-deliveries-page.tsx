import { PageToolbar } from "@/modules/page-toolbar";
import { useMenuData } from "@/shared/context/menu-data-context";
import layout from "@/shared/styles/app-layout.module.css";
import shell from "@/shared/styles/page-shell.module.css";
import styles from "./suppliers-deliveries-page.module.css";

const PDF_INPUT_ID = "suppliers-pdf-input";

export function SuppliersDeliveriesPage() {
  const { error, warn } = useMenuData();

  return (
    <div className={shell.page}>
      {error ? <div className={layout.msgErr}>{error}</div> : null}
      {warn ? <div className={layout.msgWarn}>{warn}</div> : null}

      <PageToolbar
        title="Поставщики и поставки"
        subtitle="Отслеживайте поступления ваших заказов"
        pdfInputId={PDF_INPUT_ID}
      />

      <section
        className={styles.placeholderWrap}
        aria-label="Раздел в разработке"
      >
        <div className={styles.placeholder}>
          <p className={styles.placeholderBadge}>В разработке</p>
          <p className={styles.placeholderText}>
            Данное окно планируется при дальнейшем развитии сервиса
          </p>
        </div>
      </section>
    </div>
  );
}
