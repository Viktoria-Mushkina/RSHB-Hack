export interface Product {
  id: number;
  name: string;
  category: string;
  cuisine_types: string[];
  seasons: string[];
  
  image_url?: string | null;
}

export interface Farmer {
  id: number;
  name: string;
  product_name: string;
  category: string;
  region: string;
  description?: string;
  website_url?: string;
  product_url?: string;
  organization_id?: string;
  product_id?: number | null;
}

export interface ProductWithFarmers {
  product: Product;
  available_farmers: Farmer[];
  season_label?: string;
  season_hint?: string;
  related_dishes?: string[];
  
  menu_dish_count?: number;
}

export interface SeasonChangeItem {
  dish_name: string;
  subtitle: string;
  days_until: number;
  ingredients: string[];
}

export interface SupplierPreview {
  id: number;
  name: string;
  product_line: string;
  region: string;
  badge: string;
  
  website_url?: string | null;
}

export interface MenuDishIngredient {
  product_id: number;
  name: string;
  category: string;
  seasons?: string[];
  image_url?: string | null;
  season_label?: string;
  season_variant: "in" | "out" | "soon";
}

export interface MenuDish {
  id: number;
  name: string;
  category: string;
  description?: string | null;
  status: "in_menu" | "needs_update" | "not_in_menu";
  seasonality_percent: number;
  image_url?: string | null;
  ingredients: MenuDishIngredient[];
}

export interface UploadResponse {
  filename: string;
  success: boolean;
  products_count: number;
  products_by_category: Record<string, Product[]>;
  products: Product[];
  products_with_farmers?: ProductWithFarmers[];
  message?: string;
  seasonality_percent?: number;
  top_suppliers?: SupplierPreview[];
  menu_season_entering?: SeasonChangeItem[];
  menu_season_exiting?: SeasonChangeItem[];
  menu_dishes?: MenuDish[];
}

export interface SeasonalChangesResponse {
  entering: SeasonChangeItem[];
  exiting: SeasonChangeItem[];
}
