import pandas as pd
from typing import Dict

from database.db import db


class ExcelImporter:
    @staticmethod
    async def ensure_tables_exist() -> bool:
        if not db.pool:
            return False

        result = await db.pool.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'farmers'
            )
            """
        )
        return bool(result)

    @staticmethod
    async def import_farmers_from_excel(file_path: str) -> bool:
        if not db.pool:
            print("База данных не подключена")
            return False

        if not await ExcelImporter.ensure_tables_exist():
            return False

        try:
            df = pd.read_excel(file_path)

            await db.pool.execute("TRUNCATE TABLE farmers RESTART IDENTITY CASCADE")

            products = await db.fetch_products()
            product_cache: Dict[str, int] = {}

            for product in products:
                name_lower = product["name"].lower().strip()
                product_cache[name_lower] = product["id"]
                if name_lower.endswith("ь"):
                    product_cache[name_lower[:-1]] = product["id"]
                if name_lower.endswith("а"):
                    product_cache[name_lower[:-1]] = product["id"]

            imported_count = 0
            skipped_count = 0
            matched_count = 0

            for _, row in df.iterrows():
                try:
                    organization_id = (
                        str(row.get("organization_id", ""))
                        if pd.notna(row.get("organization_id"))
                        else ""
                    )
                    shop_name = (
                        str(row.get("shop_name", ""))
                        if pd.notna(row.get("shop_name"))
                        else ""
                    )
                    farmer_description = (
                        str(row.get("farmer_description", ""))
                        if pd.notna(row.get("farmer_description"))
                        else ""
                    )
                    region = (
                        str(row.get("region", ""))
                        if pd.notna(row.get("region"))
                        else ""
                    )
                    category = (
                        str(row.get("category", ""))
                        if pd.notna(row.get("category"))
                        else ""
                    )
                    name_product = (
                        str(row.get("name_product", ""))
                        if pd.notna(row.get("name_product"))
                        else ""
                    )
                    product_description = (
                        str(row.get("product_description", ""))
                        if pd.notna(row.get("product_description"))
                        else ""
                    )
                    url_product = (
                        str(row.get("url_product", ""))
                        if pd.notna(row.get("url_product"))
                        else ""
                    )
                    url_farmer = (
                        str(row.get("url_farmer", ""))
                        if pd.notna(row.get("url_farmer"))
                        else ""
                    )

                    name = shop_name.strip()
                    product_name = name_product.strip()
                    description = (farmer_description or product_description or "").strip()
                    website_url = url_farmer.strip() if url_farmer else ""
                    product_url = url_product.strip() if url_product else ""

                    if not name or not product_name:
                        skipped_count += 1
                        continue

                    if len(product_name) > 255:
                        product_name = product_name[:255]
                    if len(name) > 255:
                        name = name[:255]
                    if len(organization_id) > 255:
                        organization_id = organization_id[:255]
                    if len(region) > 255:
                        region = region[:255]
                    if len(category) > 100:
                        category = category[:100]

                    product_id = None
                    product_lower = product_name.lower().strip()

                    if product_lower in product_cache:
                        product_id = product_cache[product_lower]
                        matched_count += 1
                    else:
                        for prod_name, prod_id in product_cache.items():
                            if prod_name in product_lower:
                                product_id = prod_id
                                matched_count += 1
                                break

                        if not product_id:
                            for prod_name, prod_id in product_cache.items():
                                if product_lower in prod_name:
                                    product_id = prod_id
                                    matched_count += 1
                                    break

                    await db.pool.execute(
                        """
                        INSERT INTO farmers (
                            organization_id,
                            name,
                            product_name,
                            category,
                            region,
                            description,
                            website_url,
                            product_url,
                            product_id
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                        ON CONFLICT (organization_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            product_name = EXCLUDED.product_name,
                            category = EXCLUDED.category,
                            region = EXCLUDED.region,
                            description = EXCLUDED.description,
                            website_url = EXCLUDED.website_url,
                            product_url = EXCLUDED.product_url,
                            product_id = EXCLUDED.product_id
                        """,
                        organization_id or None,
                        name,
                        product_name,
                        category,
                        region,
                        description or None,
                        website_url or None,
                        product_url or None,
                        product_id,
                    )
                    imported_count += 1

                except Exception as row_err:
                    print(f"Ошибка строки Excel: {row_err}")
                    skipped_count += 1

            print(
                f"Импорт фермеров: {imported_count} записей, "
                f"пропущено {skipped_count}, сопоставлено продуктов {matched_count}"
            )
            return True

        except Exception as e:
            print(f"Ошибка импорта Excel: {e}")
            return False
