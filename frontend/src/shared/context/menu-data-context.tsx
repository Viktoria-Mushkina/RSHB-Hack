import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  fetchBaseline,
  fetchMenuDishes,
  getApiErrorMessage,
  uploadPdf,
} from "@/shared/api";
import {
  addDishToMenu,
  recomputeMenuDish,
  removeDishFromMenu,
} from "../lib/menu-dish-mutate";
import type {
  MenuDish,
  MenuDishIngredient,
  Product,
  ProductWithFarmers,
  SeasonChangeItem,
  SupplierPreview,
  UploadResponse,
} from "../types";

type MenuDataContextValue = {
  catalogProducts: Product[];
  dictCategories: string[];
  suppliers: SupplierPreview[];
  entering: SeasonChangeItem[];
  exiting: SeasonChangeItem[];
  menuSeasonPct: number;
  cards: ProductWithFarmers[];
  menuProducts: Product[];
  menuCategories: string[];
  hasMenu: boolean;
  search: string;
  setSearch: (v: string) => void;
  isLoading: boolean;
  error: string;
  warn: string;
  filename: string;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  filteredCards: ProductWithFarmers[];
  calendarProducts: Product[];
  calendarCategories: string[];
  ingredientsCategories: string[];
  menuDishes: MenuDish[];
  menuDishCategories: string[];
  menuIngredientOptions: { value: string; label: string }[];
  reloadMenuDishes: () => Promise<void>;
  updateMenuDishIngredients: (
    dishId: number,
    ingredients: MenuDishIngredient[],
  ) => void;
  removeMenuDishFromMenu: (dishId: number) => void;
  addMenuDishToMenu: (dishId: number) => void;
};

const MenuDataContext = createContext<MenuDataContextValue | null>(null);


const API_RETRY_INITIAL_MS = 2_000;
const API_RETRY_MAX_MS = 10_000;

export function MenuDataProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");
  const [filename, setFilename] = useState("");

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [dictCategories, setDictCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPreview[]>([]);
  const [entering, setEntering] = useState<SeasonChangeItem[]>([]);
  const [exiting, setExiting] = useState<SeasonChangeItem[]>([]);

  const [menuSeasonPct, setMenuSeasonPct] = useState(0);
  const [cards, setCards] = useState<ProductWithFarmers[]>([]);
  const [menuDishes, setMenuDishes] = useState<MenuDish[]>([]);

  const cardCountRef = useRef(0);
  const baselineLoadedRef = useRef(false);
  const dishesLoadedRef = useRef(false);

  useEffect(() => {
    cardCountRef.current = cards.length;
    if (cards.length > 0) baselineLoadedRef.current = true;
  }, [cards.length]);

  const menuProducts = useMemo(
    () => cards.map((c) => c.product),
    [cards],
  );

  const menuCategories = useMemo(() => {
    const s = new Set(cards.map((c) => c.product.category));
    return [...s].sort();
  }, [cards]);

  const reloadBaseline = useCallback(async (): Promise<boolean> => {
    try {
      const baseline = await fetchBaseline();
      if (cardCountRef.current > 0) {
        baselineLoadedRef.current = true;
        return true;
      }
      if (!baseline.reachable) return false;

      if (baseline.seasonalChanges) {
        setEntering(baseline.seasonalChanges.entering ?? []);
        setExiting(baseline.seasonalChanges.exiting ?? []);
      }
      setDictCategories(baseline.categories);
      setCatalogProducts(baseline.products);
      setSuppliers(baseline.suppliers);
      baselineLoadedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const reloadMenuDishesInternal = useCallback(async (): Promise<boolean> => {
    try {
      const data = await fetchMenuDishes();
      setMenuDishes(data);
      dishesLoadedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const reloadMenuDishes = useCallback(async (): Promise<void> => {
    await reloadMenuDishesInternal();
  }, [reloadMenuDishesInternal]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let delayMs = API_RETRY_INITIAL_MS;

    const tick = async () => {
      if (cancelled) return;

      const needsBaseline =
        cardCountRef.current === 0 && !baselineLoadedRef.current;
      const needsDishes = !dishesLoadedRef.current;

      if (!needsBaseline && !needsDishes) return;

      if (needsBaseline) await reloadBaseline();
      if (needsDishes) await reloadMenuDishesInternal();

      if (cancelled) return;

      const stillNeedsBaseline =
        cardCountRef.current === 0 && !baselineLoadedRef.current;
      const stillNeedsDishes = !dishesLoadedRef.current;

      if (stillNeedsBaseline || stillNeedsDishes) {
        timeoutId = setTimeout(() => {
          void tick();
        }, delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.25), API_RETRY_MAX_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [reloadBaseline, reloadMenuDishesInternal]);

  const applyUpload = useCallback((data: UploadResponse) => {
    setFilename(data.filename);
    setMenuSeasonPct(data.seasonality_percent ?? 0);
    setCards(data.products_with_farmers ?? []);
    setSuppliers(data.top_suppliers ?? []);
    setEntering(data.menu_season_entering ?? []);
    setExiting(data.menu_season_exiting ?? []);
    setMenuDishes(data.menu_dishes ?? []);
    if ((data.menu_dishes?.length ?? 0) > 0) {
      dishesLoadedRef.current = true;
    }
  }, []);

  const doUpload = useCallback(
    async (file: File): Promise<void> => {
      setIsLoading(true);
      setError("");
      setWarn("");
      try {
        const data = await uploadPdf(file);
        if (data.success && (data.products_count ?? 0) > 0) {
          applyUpload(data);
          setWarn("");
        } else {
          setWarn(data.message || "Ингредиенты не найдены");
          setCards([]);
          setMenuDishes([]);
          setMenuSeasonPct(0);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Ошибка загрузки"));
      } finally {
        setIsLoading(false);
      }
    },
    [applyUpload, reloadMenuDishes],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setError("");
        setWarn("");
        void doUpload(file);
      } else if (file) {
        setError("Пожалуйста, выберите PDF файл");
      }
      event.target.value = "";
    },
    [doUpload],
  );

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => c.product.name.toLowerCase().includes(q));
  }, [cards, search]);

  const hasMenu = cards.length > 0;

  const calendarProducts = hasMenu ? menuProducts : catalogProducts;
  const calendarCategories = hasMenu ? menuCategories : dictCategories;
  const ingredientsCategories = hasMenu ? menuCategories : dictCategories;

  const menuDishCategories = useMemo(() => {
    const s = new Set(menuDishes.map((d) => d.category));
    return [...s].sort((a, b) => a.localeCompare(b, "ru"));
  }, [menuDishes]);

  const updateMenuDishIngredients = useCallback(
    (dishId: number, ingredients: MenuDishIngredient[]) => {
      setMenuDishes((prev) =>
        prev.map((d) =>
          d.id === dishId ? recomputeMenuDish(d, ingredients) : d,
        ),
      );
    },
    [],
  );

  const removeMenuDishFromMenu = useCallback((dishId: number) => {
    setMenuDishes((prev) =>
      prev.map((d) => (d.id === dishId ? removeDishFromMenu(d) : d)),
    );
  }, []);

  const addMenuDishToMenu = useCallback((dishId: number) => {
    setMenuDishes((prev) =>
      prev.map((d) => (d.id === dishId ? addDishToMenu(d) : d)),
    );
  }, []);

  const menuIngredientOptions = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of menuDishes) {
      for (const ing of d.ingredients) {
        m.set(ing.product_id, ing.name);
      }
    }
    return [...m.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "ru"))
      .map(([id, name]) => ({ value: String(id), label: name }));
  }, [menuDishes]);

  const value = useMemo<MenuDataContextValue>(
    () => ({
      catalogProducts,
      dictCategories,
      suppliers,
      entering,
      exiting,
      menuSeasonPct,
      cards,
      menuProducts,
      menuCategories,
      hasMenu,
      search,
      setSearch,
      isLoading,
      error,
      warn,
      filename,
      handleFileChange,
      filteredCards,
      calendarProducts,
      calendarCategories,
      ingredientsCategories,
      menuDishes,
      menuDishCategories,
      menuIngredientOptions,
      reloadMenuDishes,
      updateMenuDishIngredients,
      removeMenuDishFromMenu,
      addMenuDishToMenu,
    }),
    [
      catalogProducts,
      dictCategories,
      suppliers,
      entering,
      exiting,
      menuSeasonPct,
      cards,
      menuProducts,
      menuCategories,
      hasMenu,
      search,
      isLoading,
      error,
      warn,
      filename,
      handleFileChange,
      filteredCards,
      calendarProducts,
      calendarCategories,
      ingredientsCategories,
      menuDishes,
      menuDishCategories,
      menuIngredientOptions,
      reloadMenuDishes,
      updateMenuDishIngredients,
      removeMenuDishFromMenu,
      addMenuDishToMenu,
    ],
  );

  return (
    <MenuDataContext.Provider value={value}>{children}</MenuDataContext.Provider>
  );
}

export function useMenuData(): MenuDataContextValue {
  const ctx = useContext(MenuDataContext);
  if (!ctx) {
    throw new Error("useMenuData must be used within MenuDataProvider");
  }
  return ctx;
}
