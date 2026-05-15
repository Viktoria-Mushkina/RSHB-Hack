import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GlobalSearch } from "@/modules/global-search";
import { MenuPdfUpload } from "@/modules/menu-pdf-upload";
import { useMenuData } from "@/shared/context/menu-data-context";
import layout from "@/shared/styles/app-layout.module.css";
import { DashboardCalendar } from "../../../modules/dashboard-calendar";
import { IngredientsStrip } from "../../../modules/ingredients-strip";
import { SeasonChangesPanel } from "../../../modules/season-changes-panel";
import { SeasonalityDonut } from "../../../modules/seasonality-donut";
import { SeasonNowChart } from "../../../modules/season-now-chart";
import { SuppliersSection } from "../../../modules/suppliers-section";

export function HomePage() {
  const [searchParams] = useSearchParams();
  const highlightProductId = (() => {
    const raw = searchParams.get("productId");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  })();

  const {
    error,
    warn,
    hasMenu,
    filteredCards,
    entering,
    exiting,
    catalogProducts,
    menuSeasonPct,
    calendarProducts,
    calendarCategories,
    ingredientsCategories,
    suppliers,
  } = useMenuData();

  useEffect(() => {
    if (highlightProductId == null) return;
    const el = document.getElementById(`ingredient-card-${highlightProductId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [highlightProductId, filteredCards]);

  return (
    <div className={layout.homeStack}>
      <header className={layout.header}>
        <div className={layout.headerBrand}>
          <div className={layout.headerTitles}>
            <h1 className={layout.headerTitle}>Добро пожаловать, шеф!</h1>
            <p className={layout.headerSub}>Посмотрим, что сейчас в сезоне</p>
          </div>
        </div>
        <div className={layout.headerTools}>
          <MenuPdfUpload inputId="pdf-input" />
          <div className={layout.headerToolsSearch}>
            <GlobalSearch aria-label="Поиск по приложению" />
          </div>
        </div>
      </header>

      {error ? <div className={layout.msgErr}>{error}</div> : null}
      {warn ? <div className={layout.msgWarn}>{warn}</div> : null}

      <div className={layout.dashboardGrid}>
        <div className={layout.gridSeasonChanges}>
          <SeasonChangesPanel
            entering={entering}
            exiting={exiting}
            dataSource={hasMenu ? "menu" : "dictionary"}
            products={catalogProducts}
          />
        </div>
        {hasMenu ? (
          <section
            className={`${layout.panelWarm} ${layout.seasonalityCard} ${layout.gridSeasonChart}`}
          >
            <h2 className={layout.panelTitle}>Оценка сезонности меню</h2>
            <div className={layout.donutWrap}>
              <SeasonalityDonut percent={menuSeasonPct} />
            </div>
          </section>
        ) : (
          <section
            className={`${layout.panelWarm} ${layout.seasonalityCard} ${layout.gridSeasonChart}`}
          >
            <h2 className={layout.panelTitle}>Сезон сейчас</h2>
            <div className={layout.donutWrap}>
              <SeasonNowChart products={catalogProducts} />
            </div>
          </section>
        )}
        <div className={layout.gridCalendar}>
          <DashboardCalendar
            products={calendarProducts}
            categories={calendarCategories}
            dataSource={hasMenu ? "menu" : "dictionary"}
          />
        </div>
        <div className={layout.gridIngredients}>
          <IngredientsStrip
            items={filteredCards}
            categories={ingredientsCategories}
            highlightProductId={highlightProductId}
          />
        </div>
        <div className={layout.gridSuppliers}>
          <SuppliersSection
            suppliers={suppliers}
            dataSource={hasMenu ? "menu" : "dictionary"}
          />
        </div>
      </div>
    </div>
  );
}
