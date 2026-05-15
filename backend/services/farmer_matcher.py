from typing import Dict, List

from database.db import db
from schemas.api import Farmer


class FarmerMatcher:
    @staticmethod
    async def match_farmers_to_products(products: List[dict]) -> Dict[int, List[Farmer]]:
        result: Dict[int, List[Farmer]] = {}

        for product in products:
            product_id = product["id"]
            product_name = product["name"].lower().strip()

            if not db.pool:
                result[product_id] = []
                continue

            rows = await db.pool.fetch(
                """
                SELECT * FROM farmers
                WHERE product_id = $2
                   OR lower(trim(product_name)) = $1
                   OR lower(trim(product_name)) LIKE '%' || $1 || '%'
                   OR (
                        char_length(trim(product_name)) >= 2
                        AND $1 LIKE '%' || lower(trim(product_name)) || '%'
                      )
                ORDER BY
                    CASE WHEN product_id = $2 THEN 0 ELSE 1 END,
                    name
                LIMIT 10
                """,
                product_name,
                product_id,
            )
            result[product_id] = [Farmer(**dict(row)) for row in rows]

        return result

    @staticmethod
    async def get_farmer_details(farmer_id: int) -> Farmer | None:
        if not db.pool:
            return None

        row = await db.pool.fetchrow(
            "SELECT * FROM farmers WHERE id = $1", farmer_id
        )
        return Farmer(**dict(row)) if row else None

    @staticmethod
    async def get_farmers_by_organization(org_id: str) -> List[Farmer]:
        if not db.pool:
            return []

        rows = await db.pool.fetch(
            "SELECT * FROM farmers WHERE organization_id = $1",
            org_id,
        )
        return [Farmer(**dict(row)) for row in rows]


farmer_matcher = FarmerMatcher()
