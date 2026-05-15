from pathlib import Path

import asyncpg
from asyncpg.exceptions import UndefinedTableError
from typing import Optional

from core.config import DATABASE_URL

_DISHES_SEED_PATH = Path(__file__).resolve().parent / "seed_dishes.sql"

_PRODUCT_IMAGE_URLS: tuple[tuple[str, str], ...] = (
    ("картофель", "/ingredients/potato.png"),
    ("помидор", "/ingredients/tomato.png"),
    ("морковь", "/ingredients/carrot.png"),
    ("лук", "/ingredients/onion.png"),
    ("капуста", "/ingredients/cabbage.png"),
    ("свекла", "/ingredients/beet.png"),
    ("чеснок", "/ingredients/garlic.png"),
    ("редис", "/ingredients/radish.png"),
    ("горошек зеленый", "/ingredients/green_pea.png"),
    ("перепелиное яйцо", "/ingredients/quail_egg.png"),
    ("шампиньоны", "/ingredients/champignon.png"),
    ("лисички", "/ingredients/chanterelle.png"),
    ("белые грибы", "/ingredients/porcini.png"),
    ("говядина", "/ingredients/beef.png"),
    ("курица", "/ingredients/chicken.png"),
    ("клубника", "/ingredients/strawberry.png"),
    ("вишня", "/ingredients/cherry.png"),
    ("малина", "/ingredients/raspberry.png"),
    ("семга", "/ingredients/salmon.png"),
    ("треска", "/ingredients/cod.png"),
)

_DISH_IMAGE_URLS: tuple[tuple[str, str], ...] = (
    ("дачный салат", "/dishes/dacha_salad.png"),
    ("грибы а-ля пулеть", "/dishes/mushrooms_pullet.png"),
    ("блинчики с ягодами", "/dishes/berry_pancakes.png"),
    ("рыбная тарелка", "/dishes/fish_platter.png"),
    ("овощное рагу", "/dishes/vegetable_stew.png"),
    ("запечённые овощи", "/dishes/baked_vegetables.png"),
    ("запеченые овощи", "/dishes/baked_vegetables.png"),
    ("говядина с овощами", "/dishes/beef_with_vegetables.png"),
)


def _normalize_dish_name(name: str) -> str:
    return name.lower().strip().replace("ё", "е")


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        try:
            self.pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=10,
            )
            print("PostgreSQL подключен")
            return True
        except Exception as e:
            print(f"Ошибка подключения к PostgreSQL: {e}")
            self.pool = None
            return False

    async def ensure_dishes_schema_and_seed(self) -> None:
        if not self.pool:
            return
        await self.pool.execute(
            """
            CREATE TABLE IF NOT EXISTS dishes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                category VARCHAR(100) DEFAULT 'блюдо',
                description TEXT,
                image_url VARCHAR(500)
            );
            """
        )
        await self.pool.execute(
            "ALTER TABLE dishes ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
        )
        await self.pool.execute(
            """
            CREATE TABLE IF NOT EXISTS dish_ingredients (
                dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                PRIMARY KEY (dish_id, product_id)
            );
            """
        )
        await self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_dish_ingredients_product ON dish_ingredients(product_id)"
        )
        await self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category)"
        )
        n_dishes = await self.pool.fetchval("SELECT COUNT(*) FROM dishes") or 0
        if not _DISHES_SEED_PATH.is_file():
            print("seed_dishes.sql не найден, пропуск сида блюд")
            await self.ensure_dish_image_urls()
            return
        raw = _DISHES_SEED_PATH.read_text(encoding="utf-8")
        idx = raw.find("INSERT INTO dish_ingredients")
        if idx == -1:
            print("seed_dishes.sql: нет блока dish_ingredients")
            await self.ensure_dish_image_urls()
            return
        sql_dishes = raw[:idx].strip()
        sql_links = raw[idx:].strip()
        async with self.pool.acquire() as conn:
            if n_dishes == 0 and sql_dishes:
                await conn.execute(sql_dishes)
            n_links = await conn.fetchval("SELECT COUNT(*) FROM dish_ingredients") or 0
            if n_links == 0 and sql_links:
                await conn.execute(sql_links)
        await self.ensure_dish_image_urls()

    async def ensure_dish_image_urls(self) -> None:
        if not self.pool:
            return
        for name, url in _DISH_IMAGE_URLS:
            await self.pool.execute(
                """
                UPDATE dishes SET image_url = $2
                WHERE lower(trim(replace(name, 'ё', 'е'))) = lower(trim(replace($1, 'ё', 'е')))
                """,
                name,
                url,
            )

    async def ensure_menu_dishes_schema(self) -> None:
        if not self.pool:
            return
        await self.pool.execute(
            """
            CREATE TABLE IF NOT EXISTS menu_dishes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL DEFAULT 'основное',
                description TEXT,
                status VARCHAR(32) NOT NULL DEFAULT 'in_menu',
                seasonality_percent INTEGER NOT NULL DEFAULT 0,
                upload_filename VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """
        )
        await self.pool.execute(
            """
            CREATE TABLE IF NOT EXISTS menu_dish_products (
                menu_dish_id INTEGER NOT NULL REFERENCES menu_dishes(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                PRIMARY KEY (menu_dish_id, product_id)
            );
            """
        )
        await self.pool.execute(
            "CREATE INDEX IF NOT EXISTS idx_menu_dishes_category ON menu_dishes(category)"
        )

    async def clear_menu_dishes(self) -> None:
        if not self.pool:
            return
        try:
            await self.pool.execute("DELETE FROM menu_dishes")
        except UndefinedTableError:
            pass

    async def build_menu_dishes_page_list(
        self, pdf_dishes: list, today=None
    ) -> list:
        from datetime import date

        if today is None:
            today = date.today()
        session: list = []
        for i, d in enumerate(pdf_dishes, start=1):
            session.append({**d, "id": i, "image_url": None})
        menu_names = {_normalize_dish_name(d["name"]) for d in session}
        try:
            catalog = await self._fetch_catalog_dishes_for_menu(menu_names, today)
        except Exception as exc:
            print(f"Справочник блюд не подгружен: {exc}")
            catalog = []
        return session + catalog

    async def replace_menu_dishes(
        self, dishes: list, upload_filename: str = ""
    ) -> list:
        if not self.pool:
            return []
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("DELETE FROM menu_dishes")
                result = []
                for d in dishes:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO menu_dishes (
                            name, category, description, status,
                            seasonality_percent, upload_filename
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id
                        """,
                        d["name"],
                        d.get("category") or "основное",
                        d.get("description"),
                        d.get("status") or "in_menu",
                        d.get("seasonality_percent") or 0,
                        upload_filename,
                    )
                    mid = row["id"]
                    for ing in d.get("ingredients") or []:
                        pid = ing.get("product_id")
                        if pid:
                            await conn.execute(
                                """
                                INSERT INTO menu_dish_products (menu_dish_id, product_id)
                                VALUES ($1, $2)
                                ON CONFLICT DO NOTHING
                                """,
                                mid,
                                pid,
                            )
                    result.append({**d, "id": mid})
                return result

    async def fetch_menu_dishes(self) -> list:
        from datetime import date

        today = date.today()
        if not self.pool:
            return []
        try:
            rows = await self.pool.fetch(
                """
                SELECT id, name, category, description, status,
                       seasonality_percent, upload_filename, created_at
                FROM menu_dishes
                ORDER BY category, name
                """
            )
        except UndefinedTableError:
            return await self._fetch_catalog_dishes_for_menu(set(), today)

        if not rows:
            return await self._fetch_catalog_dishes_for_menu(set(), today)

        dish_ids = [r["id"] for r in rows]
        link_rows = await self.pool.fetch(
            """
            SELECT mdp.menu_dish_id AS dish_id, p.id, p.name, p.category,
                   p.seasons, p.image_url
            FROM menu_dish_products mdp
            JOIN products p ON p.id = mdp.product_id
            WHERE mdp.menu_dish_id = ANY($1::int[])
            ORDER BY p.name
            """,
            dish_ids,
        )
        from services.menu_dish_builder import ingredient_season_variant
        from services.seasonality import classify_ingredient

        by_dish: dict[int, list] = {}
        for lr in link_rows:
            by_dish.setdefault(lr["dish_id"], []).append(dict(lr))

        out = []
        for r in rows:
            ingredients_raw = by_dish.get(r["id"], [])
            ingredients = []
            for p in ingredients_raw:
                info = classify_ingredient(p, today)
                ingredients.append(
                    {
                        "product_id": p["id"],
                        "name": p["name"],
                        "category": p.get("category") or "",
                        "seasons": list(p.get("seasons") or []),
                        "image_url": p.get("image_url"),
                        "season_label": info.label,
                        "season_variant": ingredient_season_variant(p, today),
                    }
                )
            out.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "category": r["category"],
                    "description": r.get("description"),
                    "image_url": None,
                    "status": r.get("status") or "in_menu",
                    "seasonality_percent": r.get("seasonality_percent") or 0,
                    "ingredients": ingredients,
                }
            )
        menu_names = {_normalize_dish_name(d["name"]) for d in out}
        try:
            catalog = await self._fetch_catalog_dishes_for_menu(menu_names, today)
        except Exception as exc:
            print(f"Справочник блюд не подгружен: {exc}")
            catalog = []
        return out + catalog

    async def _fetch_catalog_dishes_for_menu(
        self, exclude_names: set, today
    ) -> list:
        if not self.pool:
            return []
        try:
            rows = await self.pool.fetch(
                """
                SELECT id, name, category, description, image_url
                FROM dishes
                ORDER BY category, name
                """
            )
        except UndefinedTableError:
            return []

        from services.menu_dish_builder import (
            dish_menu_status,
            dish_seasonality_percent,
            ingredient_season_variant,
        )
        from services.seasonality import classify_ingredient

        if not rows:
            return []

        dish_ids = [r["id"] for r in rows]
        link_rows = await self.pool.fetch(
            """
            SELECT di.dish_id, p.id, p.name, p.category, p.seasons, p.image_url
            FROM dish_ingredients di
            JOIN products p ON p.id = di.product_id
            WHERE di.dish_id = ANY($1::int[])
            ORDER BY p.name
            """,
            dish_ids,
        )
        by_dish: dict[int, list] = {}
        for lr in link_rows:
            by_dish.setdefault(lr["dish_id"], []).append(dict(lr))

        out = []
        for r in rows:
            norm = _normalize_dish_name(r["name"])
            if norm in exclude_names:
                continue
            ingredients_raw = by_dish.get(r["id"], [])
            ingredients = []
            for p in ingredients_raw:
                info = classify_ingredient(p, today)
                ingredients.append(
                    {
                        "product_id": p["id"],
                        "name": p["name"],
                        "category": p.get("category") or "",
                        "seasons": list(p.get("seasons") or []),
                        "image_url": p.get("image_url"),
                        "season_label": info.label,
                        "season_variant": ingredient_season_variant(p, today),
                    }
                )
            pct = dish_seasonality_percent(ingredients, today)
            status = dish_menu_status(
                ingredients, today, seasonality_percent=pct, catalog_only=True
            )
            out.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "category": r["category"] or "блюдо",
                    "description": r.get("description"),
                    "image_url": r.get("image_url"),
                    "status": status,
                    "seasonality_percent": pct,
                    "ingredients": ingredients,
                }
            )
        return out

    async def ensure_product_image_urls(self) -> None:
        if not self.pool:
            return
        await self.pool.execute(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
        )
        for name, url in _PRODUCT_IMAGE_URLS:
            await self.pool.execute(
                "UPDATE products SET image_url = $2 WHERE lower(trim(name)) = lower(trim($1))",
                name,
                url,
            )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            print("PostgreSQL отключен")

    async def fetch_products(self):
        if not self.pool:
            return []
        rows = await self.pool.fetch(
            """
            SELECT id, name, category, cuisine_types, seasons, image_url
            FROM products
            ORDER BY category, name
            """
        )
        return [dict(row) for row in rows]

    async def fetch_farmers_by_product(self, product_name: str):
        if not self.pool:
            return []
        pn = product_name.lower().strip()
        rows = await self.pool.fetch(
            """
            SELECT * FROM farmers f
            WHERE f.product_id IN (SELECT id FROM products WHERE lower(trim(name)) = $1)
               OR lower(trim(f.product_name)) = $1
               OR lower(trim(f.product_name)) LIKE '%' || $1 || '%'
               OR (
                    char_length(trim(f.product_name)) >= 2
                    AND $1 LIKE '%' || lower(trim(f.product_name)) || '%'
                  )
            ORDER BY name
            """,
            pn,
        )
        return [dict(row) for row in rows]

    async def fetch_farmers_by_category(self, category: str):
        if not self.pool:
            return []
        rows = await self.pool.fetch(
            """
            SELECT * FROM farmers
            WHERE category = $1
            ORDER BY name
            """,
            category,
        )
        return [dict(row) for row in rows]

    async def fetch_all_farmers(self):
        if not self.pool:
            return []
        rows = await self.pool.fetch("SELECT * FROM farmers ORDER BY name")
        return [dict(row) for row in rows]

    async def fetch_farmers_top(self, limit: int = 3):
        if not self.pool:
            return []
        rows = await self.pool.fetch(
            "SELECT * FROM farmers ORDER BY id ASC LIMIT $1", limit
        )
        return [dict(row) for row in rows]

    async def fetch_product_categories(self) -> list:
        if not self.pool:
            return []
        rows = await self.pool.fetch(
            "SELECT DISTINCT category FROM products ORDER BY category"
        )
        return [r["category"] for r in rows]

    async def fetch_dish_names_for_product_ids(
        self, product_ids: list
    ) -> dict:
        if not self.pool or not product_ids:
            return {}
        try:
            rows = await self.pool.fetch(
                """
                SELECT di.product_id, array_agg(d.name ORDER BY d.name) AS names
                FROM dish_ingredients di
                JOIN dishes d ON d.id = di.dish_id
                WHERE di.product_id = ANY($1::int[])
                GROUP BY di.product_id
                """,
                product_ids,
            )
        except UndefinedTableError:
            return {}
        out: dict = {}
        for r in rows:
            out[r["product_id"]] = list(r["names"] or [])
        return out


db = Database()
