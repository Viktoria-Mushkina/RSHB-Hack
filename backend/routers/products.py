from datetime import date

from fastapi import APIRouter, HTTPException

from database.db import db
from schemas.api import SeasonChangeItem, SeasonalChangesResponse
from services.menu_dishes import enrich_product_for_matching
from services.seasonality import global_dictionary_changes

router = APIRouter()

@router.get("/products")
async def get_all_products():
    if not db.pool:
        raise HTTPException(500, "База данных не подключена")

    products = await db.fetch_products()
    return {"count": len(products), "products": products}

@router.get("/products/categories")
async def get_product_categories():
    if not db.pool:
        raise HTTPException(500, "База данных не подключена")
    categories = await db.fetch_product_categories()
    return {"categories": categories}

@router.get("/products/seasonal-changes", response_model=SeasonalChangesResponse)
async def get_seasonal_changes_from_dictionary():
    if not db.pool:
        raise HTTPException(500, "База данных не подключена")
    today = date.today()
    rows = await db.fetch_products()
    enriched = [enrich_product_for_matching(dict(p)) for p in rows]
    entering = global_dictionary_changes(enriched, today, entering=True, limit=3)
    exiting = global_dictionary_changes(enriched, today, entering=False, limit=3)

    def pack(changes):
        return [
            SeasonChangeItem(
                dish_name=x.dish_name,
                subtitle=x.subtitle,
                days_until=x.days,
                ingredients=x.ingredients,
            )
            for x in changes
        ]

    return SeasonalChangesResponse(entering=pack(entering), exiting=pack(exiting))

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "morph": True,
        "db": db.pool is not None,
    }
