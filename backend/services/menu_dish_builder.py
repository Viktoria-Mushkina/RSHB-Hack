from __future__ import annotations

import re
from datetime import date
from typing import Any, Dict, List, Tuple

from services.menu_dishes import is_menu_section_header
from services.seasonality import classify_ingredient

DISH_CATEGORIES = (
    "основное",
    "супы",
    "закуски",
    "салаты",
    "десерты",
    "гарниры",
    "напитки",
    "блюдо",
)

_CATEGORY_RULES: Tuple[Tuple[str, str], ...] = (
    (r"\bсуп", "супы"),
    (r"\bборщ|\bщи\b|\bбульон", "супы"),
    (r"\bсалат", "салаты"),
    (r"\bзакуск|\bтартар|\bбрускет", "закуски"),
    (r"\bдесерт|\bторт|\bпирог|\bкекс|\bмусс|\bморожен", "десерты"),
    (r"\bгарнир|\bпюре|\bрис\b|\bгреч", "гарниры"),
    (r"\bнапит|\bсок\b|\bкомпот|\bморс", "напитки"),
    (r"\bстейк|\bкотлет|\bзапекан|\bплов|\bрагу", "основное"),
)

def infer_dish_category(title: str, body: str = "") -> str:
    text = f"{title} {body}".lower()
    for pattern, cat in _CATEGORY_RULES:
        if re.search(pattern, text):
            return cat
    return "основное"

def _ingredient_in_season_for_score(
    product: Dict[str, Any], today: date
) -> bool:
    return classify_ingredient(product, today).label == "Сезон"

def dish_seasonality_percent(ingredients: List[Dict[str, Any]], today: date) -> int:
    if not ingredients:
        return 0
    in_season = sum(1 for p in ingredients if _ingredient_in_season_for_score(p, today))
    return int(round(100.0 * in_season / len(ingredients)))

def dish_menu_status(
    ingredients: List[Dict[str, Any]],
    today: date,
    *,
    seasonality_percent: int | None = None,
    catalog_only: bool = False,
) -> str:
    if catalog_only:
        return "not_in_menu"
    if not ingredients:
        return "in_menu"

    pct = (
        seasonality_percent
        if seasonality_percent is not None
        else dish_seasonality_percent(ingredients, today)
    )
    if pct < 50:
        return "needs_update"
    return "in_menu"

def ingredient_season_variant(
    product: Dict[str, Any], today: date
) -> str:
    info = classify_ingredient(product, today)
    if info.label == "Сезон":
        return "in"
    if info.label == "Скоро сезон":
        return "soon"
    return "out"

def build_menu_dishes_from_blocks(
    dish_blocks: List[Tuple[str, str, str]],
    products: List[Dict[str, Any]],
    today: date | None = None,
) -> List[Dict[str, Any]]:
    from services.seasonality import build_dish_ingredient_map

    if today is None:
        today = date.today()

    dish_map = build_dish_ingredient_map(dish_blocks, products)
    out: List[Dict[str, Any]] = []

    for title, body, _body_norm in dish_blocks:
        t = title.strip()
        if not t or is_menu_section_header(t):
            continue
        ingredients = dish_map.get(t) or []
        if not ingredients:
            continue

        pct = dish_seasonality_percent(ingredients, today)
        status = dish_menu_status(ingredients, today, seasonality_percent=pct)
        category = infer_dish_category(t, body)

        ing_rows = []
        for p in ingredients:
            info = classify_ingredient(p, today)
            ing_rows.append(
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
                "name": t,
                "category": category,
                "description": body[:500] if body else None,
                "status": status,
                "seasonality_percent": pct,
                "ingredients": ing_rows,
            }
        )

    out.sort(key=lambda d: (d["category"], d["name"]))
    return out
