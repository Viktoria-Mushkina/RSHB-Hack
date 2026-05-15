from collections import defaultdict
from datetime import date

from database.db import db
from schemas.api import (
    Farmer,
    MenuDish,
    MenuDishIngredient,
    Product,
    ProductWithFarmers,
    SeasonChangeItem,
    SupplierPreview,
    UploadResponse,
)
from services.farmer_matcher import farmer_matcher
from services.menu_dish_builder import build_menu_dishes_from_blocks
from services.menu_dishes import enrich_product_for_matching, extract_dish_blocks
from services.pdf_parser import PDFParser
from services.seasonality import (
    DishChange,
    classify_ingredient,
    fallback_ingredient_changes,
    map_products_to_dishes,
    seasonality_percent,
    supplier_badge_for_row,
)
from services.text_processor import text_processor

def _strip_internal(p: dict) -> dict:
    return {k: v for k, v in p.items() if not str(k).startswith("_")}

def _dish_change_to_item(dc: DishChange) -> SeasonChangeItem:
    return SeasonChangeItem(
        dish_name=dc.dish_name,
        subtitle=dc.subtitle,
        days_until=dc.days,
        ingredients=list(dc.ingredients),
    )

def _suppliers_from_menu_matches(
    farmer_matches: dict[int, list],
    pmap: dict,
    today: date,
    limit: int = 6,
) -> list[SupplierPreview]:
    fid_counts: defaultdict[int, int] = defaultdict(int)
    fid_farmer: dict[int, Farmer] = {}
    for _pid, flist in farmer_matches.items():
        for f in flist:
            fid_counts[f.id] += 1
            fid_farmer[f.id] = f
    ordered = sorted(fid_counts.keys(), key=lambda i: (-fid_counts[i], i))
    out: list[SupplierPreview] = []
    for fid in ordered[:limit]:
        f = fid_farmer[fid]
        d = f.model_dump()
        out.append(
            SupplierPreview(
                id=f.id,
                name=f.name or "Поставщик",
                product_line=f.product_name or "",
                region=f.region or "",
                badge=supplier_badge_for_row(d, pmap, today),
                website_url=f.website_url,
            )
        )
    return out

async def find_ingredients_in_text(text: str) -> list[dict]:
    if not db.pool:
        return []

    products = await db.fetch_products()
    normalized_text = text_processor.normalize_text(text)

    found: list[dict] = []
    found_ids: set[int] = set()

    for p in products:
        p_name = p["name"].lower()
        p_normalized = text_processor.normalize_word(p_name)

        if p_normalized in normalized_text or p_name in text.lower():
            if p["id"] not in found_ids:
                found_ids.add(p["id"])
                found.append(p)

    return found

async def process_pdf_upload(contents: bytes, filename: str) -> UploadResponse:
    extracted_text = await PDFParser.extract_text(contents)

    if not extracted_text:
        return UploadResponse(success=False, message="Не удалось извлечь текст из PDF")

    products_raw = await find_ingredients_in_text(extracted_text)

    if not products_raw:
        return UploadResponse(
            success=False,
            message="В меню не найдены ингредиенты из базы данных",
        )

    products = [enrich_product_for_matching(dict(p)) for p in products_raw]
    today = date.today()

    dish_blocks = extract_dish_blocks(extracted_text)
    pdf_menu_dishes_by_pid = map_products_to_dishes(dish_blocks, products)

    menu_dishes_raw = build_menu_dishes_from_blocks(dish_blocks, products, today)
    saved_dishes = await db.build_menu_dishes_page_list(menu_dishes_raw, today)

    all_rows = await db.fetch_products()
    pmap = {p["id"]: enrich_product_for_matching(dict(p)) for p in all_rows}

    pid_list = [p["id"] for p in products]
    dish_from_db = await db.fetch_dish_names_for_product_ids(pid_list)

    pct = seasonality_percent(products, today)

    farmer_matches = await farmer_matcher.match_farmers_to_products(products)

    entering_dc = fallback_ingredient_changes(products, today, True, 3)
    exiting_dc = fallback_ingredient_changes(products, today, False, 3)
    menu_season_entering = [_dish_change_to_item(x) for x in entering_dc]
    menu_season_exiting = [_dish_change_to_item(x) for x in exiting_dc]

    top_suppliers = _suppliers_from_menu_matches(farmer_matches, pmap, today, limit=6)

    by_category: dict = {}
    products_with_farmers: list[ProductWithFarmers] = []

    for product in products:
        cat = product["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(Product(**_strip_internal(product)))

        farmers = farmer_matches.get(product["id"], [])
        info = classify_ingredient(product, today)
        pid = product["id"]
        dishes = dish_from_db.get(pid) or []
        menu_dish_titles = pdf_menu_dishes_by_pid.get(pid) or []

        products_with_farmers.append(
            ProductWithFarmers(
                product=Product(**_strip_internal(product)),
                available_farmers=farmers,
                season_label=info.label,
                season_hint=info.hint,
                related_dishes=list(dishes)[:12],
                menu_dish_count=len(menu_dish_titles),
            )
        )

    menu_dishes_api = [
        MenuDish(
            id=d["id"],
            name=d["name"],
            category=d["category"],
            description=d.get("description"),
            status=d.get("status", "in_menu"),
            seasonality_percent=d.get("seasonality_percent", 0),
            image_url=d.get("image_url"),
            ingredients=[
                MenuDishIngredient(**ing) for ing in d.get("ingredients") or []
            ],
        )
        for d in saved_dishes
    ]

    return UploadResponse(
        success=True,
        filename=filename,
        products_count=len(products),
        products_by_category=by_category,
        products=[Product(**_strip_internal(p)) for p in products],
        products_with_farmers=products_with_farmers,
        seasonality_percent=pct,
        top_suppliers=top_suppliers,
        menu_season_entering=menu_season_entering,
        menu_season_exiting=menu_season_exiting,
        menu_dishes=menu_dishes_api,
    )
