from fastapi import APIRouter

from database.db import db
from schemas.api import MenuDish, MenuDishIngredient

router = APIRouter(prefix="/menu", tags=["menu"])

@router.get("/dishes", response_model=list[MenuDish])
async def list_menu_dishes():
    rows = await db.fetch_menu_dishes()
    return [
        MenuDish(
            id=r["id"],
            name=r["name"],
            category=r["category"],
            description=r.get("description"),
            status=r.get("status") or "in_menu",
            seasonality_percent=r.get("seasonality_percent") or 0,
            image_url=r.get("image_url"),
            ingredients=[MenuDishIngredient(**ing) for ing in r.get("ingredients") or []],
        )
        for r in rows
    ]
