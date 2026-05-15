import axios, { isAxiosError } from "axios";
import { API_BASE } from "@/shared/config/constants";
import type {
  Farmer,
  MenuDish,
  Product,
  SeasonalChangesResponse,
  SupplierPreview,
  UploadResponse,
} from "@/shared/types";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120_000,
});

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ошибка запроса",
): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: string }).msg)
            : String(item),
        )
        .join(", ");
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export type BaselineData = {
  seasonalChanges: SeasonalChangesResponse | null;
  categories: string[];
  products: Product[];
  suppliers: SupplierPreview[];
  reachable: boolean;
};

export async function fetchBaseline(): Promise<BaselineData> {
  const [sc, cat, pr, sup] = await Promise.allSettled([
    apiClient.get<SeasonalChangesResponse>("/products/seasonal-changes"),
    apiClient.get<{ categories?: string[] }>("/products/categories"),
    apiClient.get<{ products?: Product[] }>("/products"),
    apiClient.get<SupplierPreview[]>("/suppliers-preview"),
  ]);

  return {
    seasonalChanges:
      sc.status === "fulfilled" ? sc.value.data : null,
    categories:
      cat.status === "fulfilled" ? (cat.value.data.categories ?? []) : [],
    products:
      pr.status === "fulfilled" ? (pr.value.data.products ?? []) : [],
    suppliers: sup.status === "fulfilled" ? sup.value.data : [],
    reachable: pr.status === "fulfilled",
  };
}

export async function fetchMenuDishes(): Promise<MenuDish[]> {
  const { data } = await apiClient.get<MenuDish[]>("/menu/dishes");
  return data ?? [];
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<UploadResponse>(
    "/upload-pdf",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
}

export async function fetchFarmersByProductName(
  productName: string,
  signal?: AbortSignal,
): Promise<Farmer[]> {
  const { data } = await apiClient.get<{ farmers?: Farmer[] }>(
    `/farmers/product/${encodeURIComponent(productName)}`,
    { signal },
  );
  return data.farmers ?? [];
}
