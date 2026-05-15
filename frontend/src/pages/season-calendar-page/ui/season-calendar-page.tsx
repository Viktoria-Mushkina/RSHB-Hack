import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageToolbar } from "@/modules/page-toolbar";
import { SeasonCalendarGrid } from "@/modules/season-calendar-grid";
import { SeasonListBoard } from "@/modules/season-list-board";
import { SeasonProductDetail } from "@/modules/season-product-detail";
import { fetchFarmersByProductName } from "@/shared/api";
import { useMenuData } from "@/shared/context/menu-data-context";
import type { Farmer } from "@/shared/types";
import layout from "@/shared/styles/app-layout.module.css";
import shell from "@/shared/styles/page-shell.module.css";
import styles from "./season-calendar-page.module.css";

const CALENDAR_PDF_INPUT_ID = "calendar-pdf-input";

type Source = "all" | "menu";
type View = "months" | "list";

export function SeasonCalendarPage() {
  const {
    catalogProducts,
    menuProducts,
    cards: menuCards,
    hasMenu,
    search,
    error: uploadError,
    warn: uploadWarn,
  } = useMenuData();
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState<Source>("all");
  const [view, setView] = useState<View>("months");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const focusProductId = (() => {
    const raw = searchParams.get("productId");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  })();
  const [fetchedFarmers, setFetchedFarmers] = useState<Farmer[]>([]);

  const year = new Date().getFullYear();
  const nowMonth = new Date().getMonth();

  useEffect(() => {
    if (searchParams.get("source") === "menu" && hasMenu) setSource("menu");
    else if (searchParams.get("source") === "menu" && !hasMenu)
      setSource("all");
  }, [searchParams, hasMenu]);

  useEffect(() => {
    if (source === "menu" && !hasMenu) setSource("all");
  }, [source, hasMenu]);

  useEffect(() => {
    if (focusProductId == null) return;
    const inCatalog = catalogProducts.some((p) => p.id === focusProductId);
    const inMenu = menuProducts.some((p) => p.id === focusProductId);
    if (inMenu && hasMenu) setSource("menu");
    else if (inCatalog) setSource("all");
    setSelectedId(focusProductId);
  }, [focusProductId, catalogProducts, menuProducts, hasMenu]);

  const baseList =
    source === "menu" && hasMenu ? menuProducts : catalogProducts;

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((p) => p.name.toLowerCase().includes(q));
  }, [baseList, search]);

  const menuCardById = useMemo(() => {
    const m = new Map<number, (typeof menuCards)[number]>();
    for (const c of menuCards) m.set(c.product.id, c);
    return m;
  }, [menuCards]);

  const resolvedSelectedId = useMemo(() => {
    if (selectedId == null) return null;
    return searchFiltered.some((p) => p.id === selectedId) ? selectedId : null;
  }, [searchFiltered, selectedId]);

  const selectedProduct = useMemo(() => {
    if (resolvedSelectedId == null) return null;
    return searchFiltered.find((p) => p.id === resolvedSelectedId) ?? null;
  }, [searchFiltered, resolvedSelectedId]);

  const selectedMenuCard = useMemo(() => {
    if (!selectedProduct) return null;
    return menuCards.find((c) => c.product.id === selectedProduct.id) ?? null;
  }, [menuCards, selectedProduct]);

  const cardFarmers =
    selectedMenuCard?.available_farmers &&
    selectedMenuCard.available_farmers.length > 0
      ? selectedMenuCard.available_farmers
      : null;

  const linkedFarmers = useMemo(() => {
    if (!selectedProduct) return [];
    if (cardFarmers) return cardFarmers;
    return fetchedFarmers;
  }, [selectedProduct, cardFarmers, fetchedFarmers]);

  useEffect(() => {
    if (!selectedProduct) {
      setFetchedFarmers([]);
      return;
    }
    if (cardFarmers) return;

    const ac = new AbortController();
    const name = selectedProduct.name;
    void (async () => {
      try {
        const farmers = await fetchFarmersByProductName(name, ac.signal);
        if (!ac.signal.aborted) setFetchedFarmers(farmers);
      } catch {
        if (!ac.signal.aborted) setFetchedFarmers([]);
      }
    })();

    return () => ac.abort();
  }, [selectedProduct, cardFarmers]);

  const mainBody =
    searchFiltered.length === 0 ? (
      <p className={styles.empty}>
        {source === "menu" && !hasMenu
          ? "Загрузите PDF меню — здесь появятся только эти ингредиенты."
          : "Нет продуктов по запросу или справочник не загрузился."}
      </p>
    ) : view === "list" ? (
      <SeasonListBoard
        products={searchFiltered}
        menuCardById={menuCardById}
        hasMenu={hasMenu}
        year={year}
        selectedId={resolvedSelectedId}
        onSelectId={setSelectedId}
      />
    ) : (
      <SeasonCalendarGrid
        products={searchFiltered}
        year={year}
        nowMonth={nowMonth}
        selectedId={resolvedSelectedId}
        onSelectId={setSelectedId}
      />
    );

  return (
    <div className={shell.page}>
      {uploadError ? <div className={layout.msgErr}>{uploadError}</div> : null}
      {uploadWarn ? <div className={layout.msgWarn}>{uploadWarn}</div> : null}

      <PageToolbar
        title="Календарь сезонности"
        subtitle="Отслеживайте сезонность всех продуктов"
        pdfInputId={CALENDAR_PDF_INPUT_ID}
      />

      <div className={styles.controlsRow}>
        <div
          className={`${styles.pillSwitch} ${styles.pillSwitchWide}`}
          role="group"
          aria-label="Источник продуктов"
        >
          <div
            className={`${styles.pillHighlight} ${source === "menu" ? styles.pillHighlightRight : ""}`}
            aria-hidden
          />
          <button
            type="button"
            className={styles.pillOption}
            onClick={() => setSource("all")}
          >
            Все продукты
          </button>
          <button
            type="button"
            className={styles.pillOption}
            onClick={() => (hasMenu ? setSource("menu") : undefined)}
            disabled={!hasMenu}
            style={
              !hasMenu ? { opacity: 0.45, cursor: "not-allowed" } : undefined
            }
            title={
              hasMenu
                ? "Только ингредиенты из загруженного меню"
                : "Сначала загрузите меню"
            }
          >
            Только из меню
          </button>
        </div>

        <div
          className={`${styles.pillSwitch} ${styles.pillSwitchNarrow}`}
          role="group"
          aria-label="Вид"
        >
          <div
            className={`${styles.pillHighlight} ${view === "list" ? styles.pillHighlightRight : ""}`}
            aria-hidden
          />
          <button
            type="button"
            className={styles.pillOption}
            onClick={() => setView("months")}
          >
            <img src="/icons/month-icon.svg" alt="" />
            Месяцы
          </button>
          <button
            type="button"
            className={styles.pillOption}
            onClick={() => setView("list")}
          >
            <img src="/icons/list-icon.svg" alt="" />
            Список
          </button>
        </div>
      </div>

      <div
        className={
          selectedProduct
            ? shell.contentSplit
            : `${shell.contentSplit} ${shell.contentSplitSingle}`
        }
      >
        <div className={shell.tableColumn}>{mainBody}</div>
        {selectedProduct ? (
          <SeasonProductDetail
            product={selectedProduct}
            menuCard={selectedMenuCard}
            year={year}
            farmers={linkedFarmers}
            hasMenu={hasMenu}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
