import os
from contextlib import asynccontextmanager

from core.config import FARMERS_EXCEL_PATH
from database.db import db
from services.excel_importer import ExcelImporter

@asynccontextmanager
async def app_lifespan(_app):
    await db.connect()
    await db.ensure_dishes_schema_and_seed()
    await db.ensure_menu_dishes_schema()
    await db.clear_menu_dishes()
    await db.ensure_product_image_urls()

    if os.path.exists(FARMERS_EXCEL_PATH):
        print(f"Найден файл фермеров: {FARMERS_EXCEL_PATH}")
        await ExcelImporter.import_farmers_from_excel(FARMERS_EXCEL_PATH)
    else:
        print(f"Файл с фермерами не найден: {FARMERS_EXCEL_PATH}")

    yield

    await db.disconnect()
