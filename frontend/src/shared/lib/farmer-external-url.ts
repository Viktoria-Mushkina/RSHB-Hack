import type { Farmer } from "../types";


export function farmerExternalUrl(f: Farmer): string | null {
  const raw = (f.website_url ?? f.product_url ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}
