from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from database.db import db
from schemas.api import SupplierPreview
from services.farmer_matcher import farmer_matcher
from services.menu_dishes import enrich_product_for_matching
from services.seasonality import supplier_badge_for_row

router = APIRouter()

@router.get("/suppliers-preview", response_model=List[SupplierPreview])
async def suppliers_preview():
    if not db.pool:
        raise HTTPException(500, "База данных не подключена")
    today = date.today()
    all_rows = await db.fetch_products()
    pmap = {p["id"]: enrich_product_for_matching(dict(p)) for p in all_rows}
    top_rows = await db.fetch_farmers_top(3)
    return [
        SupplierPreview(
            id=r["id"],
            name=r["name"] or "Поставщик",
            product_line=r["product_name"] or "",
            region=r["region"] or "",
            badge=supplier_badge_for_row(dict(r), pmap, today),
            website_url=r.get("website_url"),
        )
        for r in top_rows
    ]

@router.get("/farmers")
async def get_all_farmers(limit: Optional[int] = Query(None, ge=1, le=500)):
    if not db.pool:
        raise HTTPException(500, "База данных не подключена")

    if limit is not None:
        farmers = await db.fetch_farmers_top(limit)
        return {"count": len(farmers), "farmers": farmers}

    farmers = await db.fetch_all_farmers()
    return {"count": len(farmers), "farmers": farmers}

@router.get("/farmers/{farmer_id}")
async def get_farmer_details(farmer_id: int):
    farmer = await farmer_matcher.get_farmer_details(farmer_id)
    if not farmer:
        raise HTTPException(404, "Фермер не найден")
    return farmer

@router.get("/farmers/product/{product_name}")
async def get_farmers_by_product(product_name: str):
    farmers = await db.fetch_farmers_by_product(product_name)
    return {"count": len(farmers), "farmers": farmers}